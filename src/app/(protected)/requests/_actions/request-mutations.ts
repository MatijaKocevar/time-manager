"use server"

import { revalidatePath } from "next/cache"
import { validateInput } from "@/lib/validation"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireAdmin } from "@/lib/auth-helpers"
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
import { executeApproval } from "./request-helpers"
import { getUrnikCookie } from "@/app/(protected)/urnik-net-overview/_utils/urnik-session"
import {
    extractCsrfToken,
    submitVacationToUrnikNet,
    submitSickLeaveToUrnikNet,
    submitWorkFromHomeToUrnikNet,
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
            sendToUrnikNet,
        } = validation.data

        if (startDate > endDate) {
            return { error: "Start date must be before or equal to end date" }
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
                affectsHourType: true,
            },
        })

        if (sendToUrnikNet && type !== "WORK") {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { urnikUsername: true, urnikUserId: true },
            })

            if (user?.urnikUsername && user?.urnikUserId) {
                try {
                    const cookie = await getUrnikCookie()
                    let submitResult: { success: boolean; error?: string } = {
                        success: false,
                        error: "Authentication failed",
                    }

                    if (cookie) {
                        if (type === "VACATION") {
                            submitResult = await submitVacationToUrnikNet(
                                cookie,
                                user.urnikUserId,
                                startDate,
                                endDate,
                                createdRequest.id
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
                                        createdRequest.id
                                    )
                                } else if (type === "WORK_FROM_HOME") {
                                    submitResult = await submitWorkFromHomeToUrnikNet(
                                        cookie,
                                        csrf.token,
                                        csrf.antiforgery,
                                        user.urnikUserId,
                                        startDate,
                                        endDate,
                                        createdRequest.id
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
