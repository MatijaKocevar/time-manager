"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import { mapRequestTypeToShiftLocation, isWeekday } from "../../shifts/utils/request-shift-mapping"
import {
    CreateRequestSchema,
    UpdateRequestSchema,
    CancelRequestSchema,
    ApproveRequestSchema,
    RejectRequestSchema,
    type CreateRequestInput,
    type UpdateRequestInput,
    type CancelRequestInput,
    type ApproveRequestInput,
    type RejectRequestInput,
    type RequestDisplay,
} from "../schemas/request-schemas"

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
            data: { status: "CANCELLED" },
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

            if (request.type === "VACATION" || request.type === "SICK_LEAVE") {
                const hourType = request.type === "VACATION" ? "VACATION" : "SICK_LEAVE"
                const currentDate = new Date(request.startDate)
                const endDate = new Date(request.endDate)

                while (currentDate <= endDate) {
                    const dayOfWeek = currentDate.getDay()
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                    if (!isWeekend) {
                        await tx.hourEntry.create({
                            data: {
                                userId: request.userId,
                                date: new Date(currentDate),
                                hours: 8,
                                type: hourType,
                                description: `Auto-generated from ${request.type.toLowerCase()} request`,
                                taskId: null,
                            },
                        })
                    }

                    currentDate.setDate(currentDate.getDate() + 1)
                }
            }

            const shiftLocation = mapRequestTypeToShiftLocation(request.type)
            const shiftDate = new Date(request.startDate)
            shiftDate.setHours(0, 0, 0, 0)
            const shiftEndDate = new Date(request.endDate)
            shiftEndDate.setHours(0, 0, 0, 0)

            while (shiftDate <= shiftEndDate) {
                if (isWeekday(shiftDate)) {
                    const normalizedDate = new Date(shiftDate)
                    normalizedDate.setHours(0, 0, 0, 0)

                    await tx.shift.upsert({
                        where: {
                            userId_date: {
                                userId: request.userId,
                                date: normalizedDate,
                            },
                        },
                        update: {
                            location: shiftLocation,
                            notes: `Auto-generated from ${request.type.toLowerCase()} request`,
                        },
                        create: {
                            userId: request.userId,
                            date: normalizedDate,
                            location: shiftLocation,
                            notes: `Auto-generated from ${request.type.toLowerCase()} request`,
                        },
                    })
                }
                shiftDate.setDate(shiftDate.getDate() + 1)
            }
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
