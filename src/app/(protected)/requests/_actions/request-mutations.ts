"use server"

import { revalidatePath } from "next/cache"
import { validateInput } from "@/lib/validation"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireAdmin } from "@/lib/auth-helpers"
import { startOfDay, endOfDay } from "@/lib/date-utils"
import { refreshDailyHourSummary } from "@/lib/materialized-views"
import {
    getOvertimeAvailability,
    getRequestOvertimeHours,
    formatOvertimeHours,
} from "@/lib/overtime"
import {
    CreateRequestSchema,
    UpdateRequestSchema,
    CancelRequestSchema,
    CancelApprovedRequestSchema,
    type CreateRequestInput,
    type UpdateRequestInput,
    type CancelRequestInput,
    type CancelApprovedRequestInput,
} from "../_schemas/request-schemas"
import { isUrnikSubmittableRequestType } from "../_constants"
import { executeApproval } from "./request-helpers"
import { getUrnikCookieForUser } from "@/app/(protected)/urnik-net-overview/_utils/urnik-session"
import {
    extractCsrfToken,
    submitVacationToUrnikNet,
    submitSickLeaveToUrnikNet,
    submitWorkFromHomeToUrnikNet,
    submitFreeHoursToUrnikNet,
} from "@/app/(protected)/urnik-net-overview/requests/_actions/urnik-net-day-submission"
import { notifyAdminsNewRequest, notifyUserCancellation } from "@/features/notifications/lib/notify"

export async function createRequest(input: CreateRequestInput) {
    try {
        const session = await requireAuth()

        const validation = validateInput(CreateRequestSchema, input)
        if (!validation.success) {
            return { error: validation.error }
        }

        const {
            startDate,
            endDate,
            startTime,
            endTime,
            isFullDay,
            requestedHours,
            type,
            reason,
            location,
            skipWeekends,
            skipHolidays,
            sendToUrnikNet,
        } = validation.data

        if (startDate > endDate) {
            return { error: "Start date must be before or equal to end date" }
        }

        if (type === "OVERTIME_USE") {
            const availability = await getOvertimeAvailability(session.user.id)
            const requestedOvertime = await getRequestOvertimeHours(
                {
                    isFullDay,
                    startDate,
                    endDate,
                    requestedHours: requestedHours ?? null,
                    skipWeekends,
                    skipHolidays,
                },
                availability.workHoursPerDay
            )

            if (requestedOvertime > availability.available + 0.001) {
                return {
                    error: `Not enough overtime available: ${formatOvertimeHours(requestedOvertime)} requested, ${formatOvertimeHours(availability.available)} available`,
                }
            }
        }

        const createdRequest = await prisma.request.create({
            data: {
                userId: session.user.id,
                type,
                startDate,
                endDate,
                startTime,
                endTime,
                isFullDay,
                requestedHours,
                reason,
                location,
                skipWeekends,
                skipHolidays,
                affectsHourType: true,
            },
        })

        if (sendToUrnikNet && isUrnikSubmittableRequestType(type)) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { urnikUsername: true, urnikUserId: true },
            })

            if (user?.urnikUsername && user?.urnikUserId) {
                try {
                    const cookie = await getUrnikCookieForUser(session.user.id)
                    let submitResult: { success: boolean; error?: string } = {
                        success: false,
                        error: "Authentication failed",
                    }

                    if (cookie) {
                        const urnikComment =
                            reason && reason.trim().length > 0
                                ? `${reason.trim()} ${createdRequest.id}`
                                : createdRequest.id

                        if (type === "OVERTIME_USE") {
                            submitResult = await submitFreeHoursToUrnikNet(
                                cookie,
                                startDate,
                                startTime ?? "",
                                endTime ?? "",
                                urnikComment
                            )
                        } else if (type === "VACATION") {
                            submitResult = await submitVacationToUrnikNet(
                                cookie,
                                user.urnikUserId,
                                startDate,
                                endDate,
                                urnikComment
                            )
                        } else {
                            const csrf = await extractCsrfToken(cookie)
                            if (csrf) {
                                if (type === "SICK_LEAVE") {
                                    submitResult = await submitSickLeaveToUrnikNet(
                                        cookie,
                                        csrf.token,
                                        csrf.antiforgery,
                                        user.urnikUserId,
                                        startDate,
                                        endDate,
                                        urnikComment
                                    )
                                } else if (type === "WORK_FROM_HOME") {
                                    submitResult = await submitWorkFromHomeToUrnikNet(
                                        cookie,
                                        csrf.token,
                                        csrf.antiforgery,
                                        user.urnikUserId,
                                        startDate,
                                        endDate,
                                        urnikComment
                                    )
                                }
                            } else {
                                submitResult = {
                                    success: false,
                                    error: "Could not extract CSRF token",
                                }
                            }
                        }
                    }

                    await prisma.request.update({
                        where: { id: createdRequest.id },
                        data: {
                            urnikNetSynced: true,
                            urnikNetStatus: submitResult.success ? "PENDING" : "FAILED",
                            urnikNetSyncedAt: new Date(),
                            urnikNetError: submitResult.success
                                ? null
                                : (submitResult.error ?? null),
                        },
                    })
                } catch (urnikError) {
                    await prisma.request.update({
                        where: { id: createdRequest.id },
                        data: {
                            urnikNetSynced: true,
                            urnikNetStatus: "FAILED",
                            urnikNetSyncedAt: new Date(),
                            urnikNetError:
                                urnikError instanceof Error ? urnikError.message : "Unknown error",
                        },
                    })
                }
            }
        }

        const shouldNotifyAdmins = !sendToUrnikNet || createdRequest.urnikNetStatus === "FAILED"

        if (shouldNotifyAdmins) {
            const autoAdmin = await prisma.user.findFirst({
                where: {
                    role: "ADMIN",
                    autoAdmin: true,
                    managedUsers: { some: { userId: session.user.id } },
                },
                select: { id: true },
            })

            if (autoAdmin) {
                const latestRequest = await prisma.request.findUnique({
                    where: { id: createdRequest.id },
                })
                if (latestRequest) {
                    await executeApproval(latestRequest, autoAdmin.id)
                }
            }

            notifyAdminsNewRequest({
                requestId: createdRequest.id,
                requestUserId: session.user.id,
                userName: session.user.name || session.user.email || "Unknown User",
                requestType: type,
                startDate,
                endDate,
                reason,
                autoApproved: !!autoAdmin,
            }).catch((error) => {
                console.error("Failed to notify admins:", error)
            })
        }

        revalidatePath("/requests")
        revalidatePath("/hours")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to create request" }
    }
}

export async function updateRequest(input: UpdateRequestInput) {
    try {
        const session = await requireAuth()

        const validation = validateInput(UpdateRequestSchema, input)
        if (!validation.success) {
            return { error: validation.error }
        }

        const validatedData = validation.data

        const existing = await prisma.request.findUnique({
            where: { id: validatedData.id },
        })

        if (!existing || existing.userId !== session.user.id) {
            return { error: "Request not found" }
        }

        if (existing.status !== "PENDING") {
            return { error: "Can only update pending requests" }
        }

        if (existing.urnikNetSynced) {
            return { error: "Cannot edit a request that was submitted to Urnik.net" }
        }

        if (
            validatedData.startDate &&
            validatedData.endDate &&
            validatedData.startDate > validatedData.endDate
        ) {
            return { error: "Start date must be before or equal to end date" }
        }

        const updateData: Record<string, unknown> = {}
        if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate
        if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate
        if (validatedData.type !== undefined) updateData.type = validatedData.type
        if (validatedData.reason !== undefined) updateData.reason = validatedData.reason
        if (validatedData.location !== undefined) updateData.location = validatedData.location
        if (validatedData.affectsHourType !== undefined)
            updateData.affectsHourType = validatedData.affectsHourType

        const effectiveType = validatedData.type ?? existing.type

        if (effectiveType === "OVERTIME_USE") {
            updateData.isFullDay = false
            updateData.requestedHours = validatedData.requestedHours ?? existing.requestedHours

            const availability = await getOvertimeAvailability(session.user.id, existing.id)
            const requestedOvertime = await getRequestOvertimeHours(
                {
                    isFullDay: false,
                    startDate: validatedData.startDate ?? existing.startDate,
                    endDate: validatedData.endDate ?? existing.endDate,
                    requestedHours:
                        updateData.requestedHours !== null &&
                        updateData.requestedHours !== undefined
                            ? Number(updateData.requestedHours)
                            : null,
                    skipWeekends: existing.skipWeekends,
                    skipHolidays: existing.skipHolidays,
                },
                availability.workHoursPerDay
            )

            if (requestedOvertime > availability.available + 0.001) {
                return {
                    error: `Not enough overtime available: ${formatOvertimeHours(requestedOvertime)} requested, ${formatOvertimeHours(availability.available)} available`,
                }
            }
        }

        await prisma.request.update({
            where: { id: validatedData.id },
            data: updateData,
        })

        revalidatePath("/requests")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to update request" }
    }
}

export async function cancelRequest(input: CancelRequestInput) {
    try {
        const session = await requireAuth()

        const validation = validateInput(CancelRequestSchema, input)
        if (!validation.success) {
            return { error: validation.error }
        }

        const { id } = validation.data

        const existing = await prisma.request.findUnique({
            where: { id },
        })

        if (!existing || existing.userId !== session.user.id) {
            return { error: "Request not found" }
        }

        if (existing.status !== "PENDING") {
            return { error: "Can only cancel pending requests" }
        }

        const updatedRequest = await prisma.request.update({
            where: { id },
            data: {
                status: "CANCELLED",
                cancelledBy: session.user.id,
                cancelledAt: new Date(),
            },
            include: {
                user: {
                    select: { name: true },
                },
            },
        })

        await notifyUserCancellation({
            userId: updatedRequest.userId,
            userName: updatedRequest.user.name || "User",
            requestType: updatedRequest.type,
            startDate: updatedRequest.startDate,
            endDate: updatedRequest.endDate,
            reason: updatedRequest.reason || undefined,
            cancelledByName: session.user.name || "You",
            cancellationReason: "Cancelled by user",
            cancelledByAdmin: false,
        })

        revalidatePath("/requests")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to cancel request" }
    }
}

export async function cancelApprovedRequest(input: CancelApprovedRequestInput) {
    try {
        const session = await requireAdmin()

        const validation = validateInput(CancelApprovedRequestSchema, input)
        if (!validation.success) {
            return { error: validation.error }
        }

        const { id, cancellationReason } = validation.data

        const request = await prisma.request.findUnique({
            where: { id },
        })

        if (!request) {
            return { error: "Request not found" }
        }

        if (request.status !== "APPROVED") {
            return { error: "Can only cancel approved requests" }
        }

        await prisma.request.update({
            where: { id },
            data: {
                status: "CANCELLED",
                cancelledBy: session.user.id,
                cancelledAt: new Date(),
                cancellationReason,
            },
        })

        if (request.type === "OVERTIME_USE") {
            const systemTask = await prisma.task.findFirst({
                where: {
                    userId: request.userId,
                    title: "System: OVERTIME_USE",
                    isSystemTask: true,
                },
            })

            if (systemTask) {
                await prisma.taskTimeEntry.deleteMany({
                    where: {
                        userId: request.userId,
                        taskId: systemTask.id,
                        startTime: {
                            gte: startOfDay(new Date(request.startDate)),
                            lte: endOfDay(new Date(request.endDate)),
                        },
                    },
                })

                await refreshDailyHourSummary()
            }
        }

        const requestWithUser = await prisma.request.findUnique({
            where: { id },
            include: {
                user: {
                    select: { name: true },
                },
            },
        })

        if (requestWithUser) {
            await notifyUserCancellation({
                userId: requestWithUser.userId,
                userName: requestWithUser.user.name || "User",
                requestType: requestWithUser.type,
                startDate: requestWithUser.startDate,
                endDate: requestWithUser.endDate,
                reason: requestWithUser.reason || undefined,
                cancelledByName: session.user.name || "Administrator",
                cancellationReason: cancellationReason || "Cancelled by administrator",
                cancelledByAdmin: true,
            })
        }

        revalidatePath("/requests")
        revalidatePath("/hours")
        revalidatePath("/shifts")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to cancel approved request" }
    }
}
