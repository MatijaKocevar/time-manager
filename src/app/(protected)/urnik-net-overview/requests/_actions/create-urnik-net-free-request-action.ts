"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getUrnikCookie } from "@/app/(protected)/urnik-net-overview/_utils/urnik-session"
import {
    CreateUrnikNetFreeRequestSchema,
    type CreateUrnikNetFreeRequestInput,
} from "../_schemas/create-urnik-net-free-request-schema"
import { requireAuth } from "@/lib/auth-helpers"
import { getErrorMessage } from "../../_utils/helpers"
import { submitFreeHoursToUrnikNet } from "./urnik-net-day-submission"

function calculateHours(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(":").map(Number)
    const [endHour, endMin] = endTime.split(":").map(Number)
    return (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60
}

export async function createUrnikNetFreeRequest(
    input: CreateUrnikNetFreeRequestInput
): Promise<{ success: boolean; trackingId?: string; error?: string }> {
    try {
        const session = await requireAuth()

        const validation = CreateUrnikNetFreeRequestSchema.safeParse(input)
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.issues[0]?.message || "Validation failed",
            }
        }

        const { date, startTime, endTime, comment } = validation.data

        const cookie = await getUrnikCookie()
        if (!cookie) {
            return { success: false, error: "Authentication failed" }
        }

        const record = await prisma.urnikRequest.create({
            data: {
                userId: session.user.id,
                category: "FREE_HOURS",
                date,
                startTime,
                endTime,
                hours: calculateHours(startTime, endTime),
                type: "OVERTIME_USE",
                status: "PENDING",
            },
        })

        const urnikComment =
            comment && comment.trim().length > 0 ? `${comment.trim()} ${record.id}` : record.id

        const result = await submitFreeHoursToUrnikNet(
            cookie,
            date,
            startTime,
            endTime,
            urnikComment
        )

        if (!result.success) {
            await prisma.urnikRequest.update({
                where: { id: record.id },
                data: { status: "FAILED", errorMessage: result.error },
            })
            return { success: false, error: result.error }
        }

        revalidatePath("/urnik-net-overview/requests")
        return { success: true, trackingId: record.id }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to submit request"),
        }
    }
}
