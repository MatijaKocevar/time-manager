"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import {
    mapRequestTypeToShiftLocation,
    mapShiftLocationToHourType,
    mapRequestTypeToHourType,
    isWeekday,
} from "../../shifts/utils/request-shift-mapping"
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
import {
    recalculateDailySummary,
    recalculateDailySummaryStandalone,
} from "../../hours/utils/summary-helpers"

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

        const { startDate, endDate, type, reason, location, affectsHourType } = validation.data

        if (startDate > endDate) {
            return { error: "Start date must be before or equal to end date" }
        }

        await prisma.request.create({
            data: {
                userId: session.user.id,
                type,
                startDate,
                endDate,
                reason,
                location,
                affectsHourType,
            },
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

        await prisma.request.update({
            where: { id },
            data: {
                status: "CANCELLED",
                cancelledBy: session.user.id,
                cancelledAt: new Date(),
            },
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
                const currentDate = new Date(request.startDate)
                const endDate = new Date(request.endDate)
                const datesToRecalculate: Date[] = []

                while (currentDate <= endDate) {
                    const dayOfWeek = currentDate.getDay()
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                    if (!isWeekend) {
                        const normalizedDate = new Date(currentDate)
                        normalizedDate.setHours(0, 0, 0, 0)
                        datesToRecalculate.push(new Date(normalizedDate))

                        await tx.hourEntry.deleteMany({
                            where: {
                                userId: request.userId,
                                date: normalizedDate,
                                type: hourType,
                                description: {
                                    startsWith: "Auto-generated from",
                                },
                                taskId: null,
                            },
                        })
                    }

                    currentDate.setDate(currentDate.getDate() + 1)
                }

                for (const date of datesToRecalculate) {
                    await recalculateDailySummary(tx, request.userId, date, hourType)
                }
            }

            console.log(`Starting shift deletion for request type: ${request.type}`)
            console.log(`Request date range: ${request.startDate} to ${request.endDate}`)

            const shiftDeleteDate = new Date(request.startDate)
            const shiftEndDate = new Date(request.endDate)

            while (shiftDeleteDate <= shiftEndDate) {
                const dayOfWeek = shiftDeleteDate.getDay()
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                if (!isWeekend) {
                    const normalizedDate = new Date(shiftDeleteDate)
                    normalizedDate.setHours(0, 0, 0, 0)

                    console.log(
                        `Attempting to delete shifts for date: ${normalizedDate.toISOString()}`
                    )

                    const existingShifts = await tx.shift.findMany({
                        where: {
                            userId: request.userId,
                            date: normalizedDate,
                        },
                    })
                    console.log(
                        `Found ${existingShifts.length} shifts for this date:`,
                        existingShifts
                    )

                    const deleteResult = await tx.shift.deleteMany({
                        where: {
                            userId: request.userId,
                            date: normalizedDate,
                            notes: {
                                contains: "Auto-generated from",
                            },
                        },
                    })

                    console.log(`Deleted ${deleteResult.count} shifts`)
                }

                shiftDeleteDate.setDate(shiftDeleteDate.getDate() + 1)
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
                const dayOfWeek = recalcDate.getDay()
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                if (!isWeekend) {
                    const normalizedDate = new Date(recalcDate)
                    normalizedDate.setHours(0, 0, 0, 0)

                    await recalculateDailySummaryStandalone(
                        request.userId,
                        normalizedDate,
                        originalHourType
                    )
                    await recalculateDailySummaryStandalone(request.userId, normalizedDate, "WORK")
                }

                recalcDate.setDate(recalcDate.getDate() + 1)
            }
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
            const shiftDate = new Date(request.startDate)
            shiftDate.setHours(0, 0, 0, 0)
            const shiftEndDate = new Date(request.endDate)
            shiftEndDate.setHours(0, 0, 0, 0)

            while (shiftDate <= shiftEndDate) {
                const isHol = holidays.some((h) => {
                    const holidayDate = new Date(h.date)
                    holidayDate.setHours(0, 0, 0, 0)
                    const checkDate = new Date(shiftDate)
                    checkDate.setHours(0, 0, 0, 0)
                    return holidayDate.getTime() === checkDate.getTime()
                })

                if (isWeekday(shiftDate) && !isHol) {
                    const normalizedDate = new Date(shiftDate)
                    normalizedDate.setHours(0, 0, 0, 0)

                    await tx.shift.upsert({
                        where: {
                            userId_date: {
                                userId: request.userId,
                                date: normalizedDate,
                            },
                        },
                        create: {
                            userId: request.userId,
                            date: normalizedDate,
                            location: shiftLocation,
                            notes: `Auto-generated from ${request.type.toLowerCase()} request`,
                        },
                        update: {
                            location: shiftLocation,
                            notes: `Auto-generated from ${request.type.toLowerCase()} request`,
                        },
                    })
                }
                shiftDate.setDate(shiftDate.getDate() + 1)
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
                                type: oldType as any,
                                taskId: null,
                            },
                            data: {
                                type: targetHourType,
                            },
                        })
                    }
                }

                // Then, create entries for dates that have no hour entries at all
                const currentDate = new Date(request.startDate)
                currentDate.setHours(0, 0, 0, 0)
                const endDate = new Date(request.endDate)
                endDate.setHours(23, 59, 59, 999)

                while (currentDate <= endDate) {
                    const isHol = holidays.some((h) => {
                        const holidayDate = new Date(h.date)
                        holidayDate.setHours(0, 0, 0, 0)
                        const checkDate = new Date(currentDate)
                        checkDate.setHours(0, 0, 0, 0)
                        return holidayDate.getTime() === checkDate.getTime()
                    })

                    if (isWeekday(currentDate) && !isHol) {
                        // Use same date range as migration for consistency
                        const dayStart = new Date(currentDate)
                        dayStart.setHours(0, 0, 0, 0)
                        const dayEnd = new Date(currentDate)
                        dayEnd.setHours(23, 59, 59, 999)

                        // Check if any hour entry exists for this date (using range to catch any timezone variations)
                        const existingEntry = await tx.hourEntry.findFirst({
                            where: {
                                userId: request.userId,
                                date: {
                                    gte: dayStart,
                                    lte: dayEnd,
                                },
                                taskId: null,
                            },
                        })

                        // Only create if no entry exists
                        if (!existingEntry) {
                            const normalizedDate = new Date(currentDate)
                            normalizedDate.setHours(0, 0, 0, 0)

                            await tx.hourEntry.create({
                                data: {
                                    userId: request.userId,
                                    date: normalizedDate,
                                    hours: 8,
                                    type: targetHourType,
                                    taskId: null,
                                },
                            })
                        }
                    }

                    currentDate.setDate(currentDate.getDate() + 1)
                }
            }
        })

        // Recalculate summaries for all hour types
        if (request.affectsHourType) {
            const targetHourType = mapRequestTypeToHourType(request.type)

            const allTypes: Array<"WORK" | "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "OTHER"> =
                ["WORK", "VACATION", "SICK_LEAVE", "WORK_FROM_HOME", "OTHER"]

            const recalcDate = new Date(request.startDate)
            const recalcEndDate = new Date(request.endDate)

            while (recalcDate <= recalcEndDate) {
                if (isWeekday(recalcDate)) {
                    const normalizedDate = new Date(recalcDate)
                    normalizedDate.setHours(0, 0, 0, 0)

                    // Recalculate all hour types to ensure proper migration
                    for (const hourType of allTypes) {
                        await recalculateDailySummaryStandalone(
                            request.userId,
                            normalizedDate,
                            hourType
                        )
                    }
                }

                recalcDate.setDate(recalcDate.getDate() + 1)
            }
        }

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
