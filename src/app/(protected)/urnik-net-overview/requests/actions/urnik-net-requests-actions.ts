"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import type { HourType } from "@/../../prisma/generated/client"
import {
    GetPendingUrnikNetRequestsInputSchema,
    type GetPendingUrnikNetRequestsInput,
    type PendingUrnikNetRequest,
} from "../schemas/urnik-net-requests-schemas"
import { requireAuth } from "@/lib/auth-helpers"
import { URNIK_USER_AGENT } from "../../lib/constants"
import { getErrorMessage } from "../../utils/helpers"
import { formatDateYYYYSlashMMDD } from "../../utils/date-helpers"
import { loginToUrnikNet, attemptUrnikNetLogin } from "./urnik-net-auth"
import { fetchUrnikNetRequests } from "./urnik-net-fetch"

export { loginToUrnikNet, attemptUrnikNetLogin, fetchUrnikNetRequests }

export async function calculatePendingUrnikNetRequests(
    input: GetPendingUrnikNetRequestsInput
): Promise<{ success: boolean; data?: PendingUrnikNetRequest[]; error?: string }> {
    try {
        const session = await requireAuth()

        const validation = GetPendingUrnikNetRequestsInputSchema.safeParse(input)
        if (!validation.success) {
            return { success: false, error: validation.error.message }
        }

        const { startDate, endDate } = validation.data

        const startDateObj = new Date(startDate)
        startDateObj.setHours(0, 0, 0, 0)
        const endDateObj = new Date(endDate)
        endDateObj.setHours(23, 59, 59, 999)

        const entries = await prisma.taskTimeEntry.findMany({
            where: {
                userId: session.user.id,
                startTime: {
                    gte: startDateObj,
                    lte: endDateObj,
                },
                endTime: {
                    not: null,
                },
                type: {
                    in: ["WORK", "WORK_FROM_HOME"],
                },
            },
            orderBy: {
                startTime: "asc",
            },
        })

        const dailyRanges = new Map<
            string,
            {
                date: Date
                firstStart: Date
                lastEnd: Date
                type: "WORK" | "WORK_FROM_HOME"
            }
        >()

        for (const entry of entries) {
            if (!entry.endTime) continue

            const dateKey = entry.startTime.toISOString().split("T")[0]
            const existing = dailyRanges.get(dateKey)
            const entryType = entry.type as HourType

            if (entryType !== "WORK" && entryType !== "WORK_FROM_HOME") continue

            if (!existing) {
                dailyRanges.set(dateKey, {
                    date: new Date(entry.startTime),
                    firstStart: entry.startTime,
                    lastEnd: entry.endTime,
                    type: entryType,
                })
            } else {
                if (entry.startTime < existing.firstStart) {
                    existing.firstStart = entry.startTime
                }
                if (entry.endTime > existing.lastEnd) {
                    existing.lastEnd = entry.endTime
                }
                if (entryType === "WORK" && existing.type === "WORK_FROM_HOME") {
                    existing.type = "WORK"
                }
            }
        }

        const pendingUrnikNetRequests: PendingUrnikNetRequest[] = Array.from(
            dailyRanges.values()
        ).map((range) => {
            const startHours = String(range.firstStart.getHours()).padStart(2, "0")
            const startMinutes = String(range.firstStart.getMinutes()).padStart(2, "0")
            const endHours = String(range.lastEnd.getHours()).padStart(2, "0")
            const endMinutes = String(range.lastEnd.getMinutes()).padStart(2, "0")

            const hours = (range.lastEnd.getTime() - range.firstStart.getTime()) / (1000 * 60 * 60)

            const dateOnly = new Date(range.date)
            dateOnly.setHours(0, 0, 0, 0)

            return {
                date: dateOnly,
                startTime: `${startHours}:${startMinutes}`,
                endTime: `${endHours}:${endMinutes}`,
                hours: Math.round(hours * 100) / 100,
                type: range.type,
                isPending: true as const,
            }
        })

        return { success: true, data: pendingUrnikNetRequests }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to calculate pending requests"),
        }
    }
}

export async function submitPendingUrnikNetRequestToUrnik(
    pendingUrnikNetRequest: PendingUrnikNetRequest
): Promise<{ success: boolean; trackingId?: string; error?: string }> {
    try {
        const session = await requireAuth()

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { urnikUsername: true, urnikPassword: true },
        })

        if (!user?.urnikUsername || !user?.urnikPassword) {
            return { success: false, error: "Urnik.net credentials not configured" }
        }

        const loginResult = await loginToUrnikNet(user.urnikUsername, user.urnikPassword)
        if (!loginResult.success || !loginResult.cookie) {
            return { success: false, error: loginResult.error || "Authentication failed" }
        }

        const urnikNetRequestRecord = await prisma.urnikRequest.create({
            data: {
                userId: session.user.id,
                date: pendingUrnikNetRequest.date,
                startTime: pendingUrnikNetRequest.startTime,
                endTime: pendingUrnikNetRequest.endTime,
                hours: pendingUrnikNetRequest.hours,
                type: pendingUrnikNetRequest.type,
                urnikType: pendingUrnikNetRequest.type === "WORK" ? 110 : 124,
                status: "PENDING",
            },
        })

        const dateTime = formatDateYYYYSlashMMDD(pendingUrnikNetRequest.date)

        const url = new URL("https://urnik.net/App/Main")
        url.searchParams.append("handler", "SaveRequestHours")
        url.searchParams.append("timeStart", pendingUrnikNetRequest.startTime)
        url.searchParams.append("timeEnd", pendingUrnikNetRequest.endTime)
        url.searchParams.append("dateTime", dateTime)
        url.searchParams.append("type", String(urnikNetRequestRecord.urnikType))
        url.searchParams.append("comment", urnikNetRequestRecord.id)

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "User-Agent": URNIK_USER_AGENT,
                Cookie: loginResult.cookie,
                Accept: "*/*",
                "Accept-Language": "en-GB,en;q=0.9,sl;q=0.8",
                "X-Requested-With": "XMLHttpRequest",
                Referer: "https://urnik.net/App/Main",
            },
        })

        if (!response.ok) {
            await prisma.urnikRequest.update({
                where: { id: urnikNetRequestRecord.id },
                data: {
                    status: "FAILED",
                    errorMessage: `HTTP ${response.status}: ${response.statusText}`,
                },
            })
            return {
                success: false,
                error: `Request failed with status ${response.status}`,
            }
        }

        return { success: true, trackingId: urnikNetRequestRecord.id }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to submit request"),
        }
    } finally {
        revalidatePath("/urnik-net-overview/requests")
    }
}

export async function syncUrnikNetStatuses(): Promise<{
    success: boolean
    syncedCount?: number
    error?: string
}> {
    try {
        const session = await requireAuth()

        let urnikNetRequestsResult = await fetchUrnikNetRequests()

        if (!urnikNetRequestsResult.success) {
            const loginResult = await attemptUrnikNetLogin()
            if (!loginResult.success) {
                return { success: false, error: "Authentication failed" }
            }

            urnikNetRequestsResult = await fetchUrnikNetRequests()
            if (!urnikNetRequestsResult.success) {
                return { success: false, error: urnikNetRequestsResult.error }
            }
        }

        const urnikNetRequests = urnikNetRequestsResult.data || []
        const pendingUrnikNetRequests = await prisma.urnikRequest.findMany({
            where: {
                userId: session.user.id,
                status: "PENDING",
            },
        })

        let syncedCount = 0
        const cuidPattern = /\b(c[a-z0-9]{24})\b/i

        for (const urnikNetReq of urnikNetRequests) {
            const match = urnikNetReq.notes.match(cuidPattern)
            if (!match) continue

            const trackingId = match[1]
            const localRequest = pendingUrnikNetRequests.find((req) => req.id === trackingId)
            if (!localRequest) continue

            let newStatus: "CONFIRMED" | "REJECTED" | null = null
            if (urnikNetReq.status.toLowerCase().includes("confirm")) {
                newStatus = "CONFIRMED"
            } else if (
                urnikNetReq.status.toLowerCase().includes("cancel") ||
                urnikNetReq.status.toLowerCase().includes("reject")
            ) {
                newStatus = "REJECTED"
            }

            if (newStatus) {
                await prisma.urnikRequest.update({
                    where: { id: localRequest.id },
                    data: {
                        status: newStatus,
                        confirmedAt: newStatus === "CONFIRMED" ? new Date() : undefined,
                        urnikRequestNo: urnikNetReq.no,
                    },
                })
                syncedCount++
            }
        }

        return { success: true, syncedCount }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to sync statuses"),
        }
    }
}

export async function getSubmittedUrnikNetRequests() {
    try {
        const session = await requireAuth()

        const submittedUrnikNetRequests = await prisma.urnikRequest.findMany({
            where: { userId: session.user.id },
            orderBy: { date: "desc" },
            select: {
                id: true,
                date: true,
                startTime: true,
                endTime: true,
                hours: true,
                type: true,
                urnikType: true,
                status: true,
                submittedAt: true,
                confirmedAt: true,
                errorMessage: true,
                urnikRequestNo: true,
            },
        })

        return { success: true, data: submittedUrnikNetRequests }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to fetch submitted requests"),
        }
    }
}
