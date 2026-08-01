"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { getErrorMessage } from "../../_utils/helpers"
import { loginToUrnikNet, attemptUrnikNetLogin } from "./urnik-net-auth"
import { fetchUrnikNetRequests } from "./urnik-net-fetch"

export { loginToUrnikNet, attemptUrnikNetLogin, fetchUrnikNetRequests }

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
