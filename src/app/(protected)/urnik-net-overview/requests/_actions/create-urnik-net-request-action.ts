"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getUrnikCookie } from "@/lib/urnik-session"
import {
    CreateUrnikNetRequestSchema,
    type CreateUrnikNetRequestInput,
} from "../_schemas/create-urnik-net-request-schema"
import { requireAuth } from "@/lib/auth-helpers"
import { URNIK_USER_AGENT } from "../../_lib/constants"
import { getErrorMessage } from "../../_utils/helpers"
import { formatDateYYYYSlashMMDD } from "../../_utils/date-helpers"

export async function createUrnikNetRequest(
    input: CreateUrnikNetRequestInput
): Promise<{ success: boolean; trackingId?: string; error?: string }> {
    try {
        const session = await requireAuth()

        const validation = CreateUrnikNetRequestSchema.safeParse(input)
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.issues[0]?.message || "Validation failed",
            }
        }

        const { type, date, startTime, endTime, comment } = validation.data

        const cookie = await getUrnikCookie()
        if (!cookie) {
            return { success: false, error: "Authentication failed" }
        }

        const [startHour, startMin] = startTime.split(":").map(Number)
        const [endHour, endMin] = endTime.split(":").map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        const hours = (endMinutes - startMinutes) / 60

        const urnikNetRequestRecord = await prisma.urnikRequest.create({
            data: {
                userId: session.user.id,
                date,
                startTime,
                endTime,
                hours,
                type,
                urnikType: type === "WORK" ? 110 : 124,
                status: "PENDING",
            },
        })

        const dateTime = formatDateYYYYSlashMMDD(date)

        const url = new URL("https://urnik.net/App/Main")
        url.searchParams.append("handler", "SaveRequestHours")
        url.searchParams.append("timeStart", startTime)
        url.searchParams.append("timeEnd", endTime)
        url.searchParams.append("dateTime", dateTime)
        url.searchParams.append("type", String(urnikNetRequestRecord.urnikType))
        url.searchParams.append("comment", comment || urnikNetRequestRecord.id)

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "User-Agent": URNIK_USER_AGENT,
                Cookie: cookie,
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

        revalidatePath("/urnik-net-overview/requests")
        return { success: true, trackingId: urnikNetRequestRecord.id }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to submit request"),
        }
    }
}

export async function retryFailedUrnikNetRequest(
    trackingId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await requireAuth()

        const urnikRequest = await prisma.urnikRequest.findFirst({
            where: {
                id: trackingId,
                userId: session.user.id,
                status: "FAILED",
            },
        })

        if (!urnikRequest) {
            return { success: false, error: "Request not found or not eligible for retry" }
        }

        const result = await createUrnikNetRequest({
            type: urnikRequest.type as "WORK" | "WORK_FROM_HOME",
            date: urnikRequest.date,
            startTime: urnikRequest.startTime ?? "",
            endTime: urnikRequest.endTime ?? "",
            comment: undefined,
        })

        if (result.success) {
            await prisma.urnikRequest.delete({
                where: { id: trackingId },
            })
        }

        return result
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to retry request"),
        }
    }
}
