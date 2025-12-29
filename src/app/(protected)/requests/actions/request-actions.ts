"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import type { HourType } from "@/../../prisma/generated/client"
import {
    mapRequestTypeToShiftLocation,
    mapShiftLocationToHourType,
    mapRequestTypeToHourType,
} from "../../shifts/utils/request-shift-mapping"
import {
    notifyAdminsNewRequest,
    notifyUserApproval,
    notifyUserRejection,
    notifyUserCancellation,
} from "@/features/notifications/lib/notify"
import {
    CreateRequestSchema,
    UpdateRequestSchema,
    CancelRequestSchema,
    ApproveRequestSchema,
    RejectRequestSchema,
    CancelApprovedRequestSchema,
    type CreateRequestInput,
    type UpdateRequestInput,
    type CancelRequestInput,
    type ApproveRequestInput,
    type RejectRequestInput,
    type CancelApprovedRequestInput,
    type RequestDisplay,
} from "../schemas/request-schemas"
import { refreshDailyHourSummary } from "@/lib/materialized-views"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

async function requireAdmin() {
    const session = await requireAuth()
    if (session.user.role !== "ADMIN") {
        throw new Error("Admin access required")
    }
    return session
}

export async function createRequest(input: CreateRequestInput) {
    try {
        const session = await requireAuth()

        const validation = CreateRequestSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { startDate, endDate, type, reason, location } = validation.data

        if (startDate > endDate) {
            return { error: "Start date must be before or equal to end date" }
        }

        const createdRequest = await prisma.request.create({
            data: {
                userId: session.user.id,
                type,
                startDate,
                endDate,
                reason,
                location,
                affectsHourType: true,
            },
        })

        notifyAdminsNewRequest({
            requestId: createdRequest.id,
            userName: session.user.name || session.user.email || "Unknown User",
            requestType: type,
            startDate,
            endDate,
            reason,
        }).catch((error) => {
            console.error("Failed to notify admins:", error)
        })

        revalidatePath("/requests")
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

        const validation = UpdateRequestSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
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

        const validation = CancelRequestSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
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

        const validation = CancelApprovedRequestSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
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

        await prisma.$transaction(async (tx) => {
            await tx.request.update({
                where: { id },
                data: {
                    status: "CANCELLED",
                    cancelledBy: session.user.id,
                    cancelledAt: new Date(),
                    cancellationReason,
                },
            })

            if (request.type === "VACATION" || request.type === "SICK_LEAVE") {
                const hourType = request.type === "VACATION" ? "VACATION" : "SICK_LEAVE"
                const startDay = new Date(request.startDate)
                startDay.setUTCHours(0, 0, 0, 0)
                const endDay = new Date(request.endDate)
                endDay.setUTCHours(0, 0, 0, 0)
                const datesToRecalculate: Date[] = []

                const daysDiff = Math.round(
                    (endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)
                )

                for (let i = 0; i <= daysDiff; i++) {
                    const currentDay = new Date(startDay)
                    currentDay.setUTCDate(startDay.getUTCDate() + i)

                    datesToRecalculate.push(new Date(currentDay))

                    await tx.hourEntry.deleteMany({
                        where: {
                            userId: request.userId,
                            date: currentDay,
                            type: hourType,
                            description: {
                                startsWith: "Auto-generated from",
                            },
                            taskId: null,
                        },
                    })
                }
            }

            console.log(`Starting shift deletion for request type: ${request.type}`)
            console.log(`Request date range: ${request.startDate} to ${request.endDate}`)

            const startDay = new Date(request.startDate)
            startDay.setUTCHours(0, 0, 0, 0)
            const endDay = new Date(request.endDate)
            endDay.setUTCHours(0, 0, 0, 0)

            const daysDiff = Math.round(
                (endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)
            )

            for (let i = 0; i <= daysDiff; i++) {
                const currentDay = new Date(startDay)
                currentDay.setUTCDate(startDay.getUTCDate() + i)

                console.log(`Attempting to delete shifts for date: ${currentDay.toISOString()}`)

                const existingShifts = await tx.shift.findMany({
                    where: {
                        userId: request.userId,
                        date: currentDay,
                    },
                })
                console.log(`Found ${existingShifts.length} shifts for this date:`, existingShifts)

                const deleteResult = await tx.shift.deleteMany({
                    where: {
                        userId: request.userId,
                        date: currentDay,
                        notes: {
                            contains: "Auto-generated from",
                        },
                    },
                })

                console.log(`Deleted ${deleteResult.count} shifts`)
            }

            // Reverse migrate hour entries if request affected hour type
            if (
                request.affectsHourType &&
                request.type !== "VACATION" &&
                request.type !== "SICK_LEAVE"
            ) {
                const shiftLocation = mapRequestTypeToShiftLocation(request.type)
                const originalHourType = mapShiftLocationToHourType(shiftLocation)
                const revertStartDate = new Date(request.startDate)
                revertStartDate.setHours(0, 0, 0, 0)
                const revertEndDate = new Date(request.endDate)
                revertEndDate.setHours(23, 59, 59, 999)

                // Bulk update all entries back to WORK
                await tx.hourEntry.updateMany({
                    where: {
                        userId: request.userId,
                        date: {
                            gte: revertStartDate,
                            lte: revertEndDate,
                        },
                        type: originalHourType,
                        taskId: null,
                    },
                    data: {
                        type: "WORK",
                    },
                })
            }
        })

        // Recalculate summaries outside transaction for better performance
        if (
            request.affectsHourType &&
            request.type !== "VACATION" &&
            request.type !== "SICK_LEAVE"
        ) {
            const shiftLocation = mapRequestTypeToShiftLocation(request.type)
            const originalHourType = mapShiftLocationToHourType(shiftLocation)
            const recalcDate = new Date(request.startDate)
            const recalcEndDate = new Date(request.endDate)

            while (recalcDate <= recalcEndDate) {
                recalcDate.setDate(recalcDate.getDate() + 1)
            }
        }

        await refreshDailyHourSummary()

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

export async function approveRequest(input: ApproveRequestInput) {
    try {
        const session = await requireAdmin()

        const validation = ApproveRequestSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { id } = validation.data

        const request = await prisma.request.findUnique({
            where: { id },
        })

        if (!request) {
            return { error: "Request not found" }
        }

        if (request.status !== "PENDING") {
            return { error: "Can only approve pending requests" }
        }

        await prisma.$transaction(async (tx) => {
            await tx.request.update({
                where: { id },
                data: {
                    status: "APPROVED",
                    approvedBy: session.user.id,
                    approvedAt: new Date(),
                },
            })

            const holidays = await tx.holiday.findMany({
                where: {
                    date: {
                        gte: request.startDate,
                        lte: request.endDate,
                    },
                },
            })

            if (request.type === "VACATION" || request.type === "SICK_LEAVE") {
            }

            const shiftLocation = mapRequestTypeToShiftLocation(request.type)

            const startDay = new Date(request.startDate)
            startDay.setUTCHours(0, 0, 0, 0)
            const endDay = new Date(request.endDate)
            endDay.setUTCHours(0, 0, 0, 0)

            console.log(
                `Request dates: startDate=${request.startDate.toISOString()}, endDate=${request.endDate.toISOString()}`
            )
            console.log(
                `Normalized: startDay=${startDay.toISOString()}, endDay=${endDay.toISOString()}`
            )

            const daysDiff = Math.round(
                (endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)
            )
            console.log(
                `Days difference calculated: ${daysDiff}, will create ${daysDiff + 1} iterations`
            )

            for (let i = 0; i <= daysDiff; i++) {
                const currentDay = new Date(startDay)
                currentDay.setUTCDate(startDay.getUTCDate() + i)

                const isHol = holidays.some((h) => {
                    const holidayDate = new Date(h.date)
                    holidayDate.setHours(0, 0, 0, 0)
                    return holidayDate.getTime() === currentDay.getTime()
                })

                if (!isHol) {
                    console.log(`  Creating shift for day ${i + 1}: ${currentDay.toISOString()}`)

                    await tx.shift.upsert({
                        where: {
                            userId_date: {
                                userId: request.userId,
                                date: currentDay,
                            },
                        },
                        create: {
                            userId: request.userId,
                            date: currentDay,
                            location: shiftLocation,
                            notes: `Auto-generated from ${request.type.toLowerCase()} request`,
                        },
                        update: {
                            location: shiftLocation,
                            notes: `Auto-generated from ${request.type.toLowerCase()} request`,
                        },
                    })
                } else {
                    console.log(
                        `  Skipping day ${i + 1}: ${currentDay.toISOString()} (holiday: ${isHol})`
                    )
                }
            }

            // Migrate or create hour entries for the request date range
            if (request.affectsHourType) {
                const targetHourType = mapRequestTypeToHourType(request.type)

                const migrateStartDate = new Date(request.startDate)
                migrateStartDate.setHours(0, 0, 0, 0)
                const migrateEndDate = new Date(request.endDate)
                migrateEndDate.setHours(23, 59, 59, 999)

                // First, migrate all existing hour entries from any type to target type
                const existingTypes = ["WORK", "VACATION", "SICK_LEAVE", "WORK_FROM_HOME", "OTHER"]

                for (const oldType of existingTypes) {
                    if (oldType !== targetHourType) {
                        await tx.hourEntry.updateMany({
                            where: {
                                userId: request.userId,
                                date: {
                                    gte: migrateStartDate,
                                    lte: migrateEndDate,
                                },
                                type: oldType as HourType,
                                taskId: null,
                            },
                            data: {
                                type: targetHourType,
                            },
                        })
                    }
                }
            }
        })

        // Recalculate summaries for all hour types
        if (request.affectsHourType) {
            await refreshDailyHourSummary()
        }

        await refreshDailyHourSummary()

        const requestUser = await prisma.user.findUnique({
            where: { id: request.userId },
            select: { name: true, email: true },
        })

        notifyUserApproval({
            userId: request.userId,
            userName: requestUser?.name || requestUser?.email || "User",
            requestType: request.type,
            startDate: request.startDate,
            endDate: request.endDate,
            reason: request.reason || undefined,
            approvedByName: session.user.name || session.user.email || "Admin",
        }).catch((error) => {
            console.error("Failed to notify user of approval:", error)
        })

        revalidatePath("/requests")
        revalidatePath("/hours")
        revalidatePath("/shifts")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to approve request" }
    }
}

export async function rejectRequest(input: RejectRequestInput) {
    try {
        const session = await requireAdmin()

        const validation = RejectRequestSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { id, rejectionReason } = validation.data

        const request = await prisma.request.findUnique({
            where: { id },
        })

        if (!request) {
            return { error: "Request not found" }
        }

        if (request.status !== "PENDING") {
            return { error: "Can only reject pending requests" }
        }

        await prisma.$transaction(async (tx) => {
            await tx.request.update({
                where: { id },
                data: {
                    status: "REJECTED",
                    rejectedBy: session.user.id,
                    rejectedAt: new Date(),
                    rejectionReason,
                },
            })

            await tx.shift.deleteMany({
                where: {
                    userId: request.userId,
                    date: {
                        gte: request.startDate,
                        lte: request.endDate,
                    },
                    notes: {
                        contains: "Auto-generated from",
                    },
                },
            })
        })

        const requestUser = await prisma.user.findUnique({
            where: { id: request.userId },
            select: { name: true, email: true },
        })

        notifyUserRejection({
            userId: request.userId,
            userName: requestUser?.name || requestUser?.email || "User",
            requestType: request.type,
            startDate: request.startDate,
            endDate: request.endDate,
            reason: request.reason || undefined,
            rejectedByName: session.user.name || session.user.email || "Admin",
            rejectionReason: rejectionReason || "No reason provided",
        }).catch((error) => {
            console.error("Failed to notify user of rejection:", error)
        })

        revalidatePath("/requests")
        revalidatePath("/shifts")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to reject request" }
    }
}

export async function getUserRequests(): Promise<RequestDisplay[]> {
    try {
        const session = await requireAuth()

        const requests = await prisma.request.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                approver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                rejector: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                canceller: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return requests
    } catch (error) {
        console.error("Error fetching user requests:", error)
        throw new Error("Failed to fetch requests")
    }
}

export async function getUserRequestsForAdmin(
    userId: string,
    statusFilter?: string[]
): Promise<RequestDisplay[]> {
    try {
        await requireAdmin()

        const requests = await prisma.request.findMany({
            where: {
                userId,
                ...(statusFilter && statusFilter.length > 0
                    ? {
                          status: {
                              in: statusFilter as Array<
                                  "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
                              >,
                          },
                      }
                    : {}),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                rejector: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                canceller: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return requests
    } catch (error) {
        console.error("Error fetching user requests:", error)
        throw new Error("Failed to fetch requests")
    }
}

export async function getAllRequests(statusFilter?: string[]): Promise<RequestDisplay[]> {
    try {
        await requireAdmin()

        const requests = await prisma.request.findMany({
            where:
                statusFilter && statusFilter.length > 0
                    ? {
                          status: {
                              in: statusFilter as Array<
                                  "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
                              >,
                          },
                      }
                    : undefined,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                rejector: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                canceller: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return requests
    } catch (error) {
        console.error("Error fetching all requests:", error)
        throw new Error("Failed to fetch requests")
    }
}
