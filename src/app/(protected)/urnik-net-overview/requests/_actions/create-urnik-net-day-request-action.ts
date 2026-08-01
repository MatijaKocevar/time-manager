"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getUrnikCookie } from "@/app/(protected)/urnik-net-overview/_utils/urnik-session"
import {
    CreateUrnikNetDayRequestSchema,
    type CreateUrnikNetDayRequestInput,
} from "../_schemas/create-urnik-net-day-request-schema"
import { requireAuth } from "@/lib/auth-helpers"
import { getErrorMessage } from "../../_utils/helpers"
import {
    extractCsrfToken,
    submitVacationToUrnikNet,
    submitSickLeaveToUrnikNet,
    submitWorkFromHomeToUrnikNet,
} from "./urnik-net-day-submission"

export async function createUrnikNetDayRequest(
    input: CreateUrnikNetDayRequestInput
): Promise<{ success: boolean; trackingId?: string; error?: string }> {
    try {
        const session = await requireAuth()

        const validation = CreateUrnikNetDayRequestSchema.safeParse(input)
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.issues[0]?.message || "Validation failed",
            }
        }

        const { type, startDate, endDate, comment } = validation.data

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                urnikUsername: true,
                urnikPassword: true,
                urnikUserId: true,
            },
        })

        if (!user?.urnikUsername || !user?.urnikPassword) {
            return { success: false, error: "Urnik.net credentials not configured" }
        }

        const cookie = await getUrnikCookie()
        if (!cookie) {
            return { success: false, error: "Authentication failed" }
        }

        const urnikUserId =
            user.urnikUserId ||
            (await prisma.user
                .findUnique({ where: { id: session.user.id }, select: { urnikUserId: true } })
                .then((u) => u?.urnikUserId ?? null))

        if (!urnikUserId) {
            return {
                success: false,
                error: "Urnik.net user ID not available. Please test your connection in profile settings.",
            }
        }

        const record = await prisma.urnikRequest.create({
            data: {
                userId: session.user.id,
                category: "DAY",
                date: startDate,
                endDate,
                type,
                status: "PENDING",
            },
        })

        let result: { success: boolean; error?: string }

        if (type === "VACATION") {
            result = await submitVacationToUrnikNet(
                cookie,
                urnikUserId,
                startDate,
                endDate,
                comment || record.id
            )
        } else {
            const csrf = await extractCsrfToken(cookie)
            if (!csrf) {
                await prisma.urnikRequest.update({
                    where: { id: record.id },
                    data: { status: "FAILED", errorMessage: "Could not extract CSRF token" },
                })
                return { success: false, error: "Could not extract CSRF token from Urnik.net" }
            }

            if (type === "SICK_LEAVE") {
                result = await submitSickLeaveToUrnikNet(
                    cookie,
                    csrf.token,
                    csrf.antiforgery,
                    urnikUserId,
                    startDate,
                    endDate,
                    comment || record.id
                )
            } else {
                result = await submitWorkFromHomeToUrnikNet(
                    cookie,
                    csrf.token,
                    csrf.antiforgery,
                    urnikUserId,
                    startDate,
                    endDate,
                    comment || record.id
                )
            }
        }

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
            error: getErrorMessage(error),
        }
    }
}
