"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth, requireAdmin } from "@/lib/auth-helpers"
import type { RequestDisplay } from "../_schemas/request-schemas"

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

        return requests.map((req) => ({
            ...req,
            requestedHours: req.requestedHours ? Number(req.requestedHours) : null,
        }))
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

        return requests.map((req) => ({
            ...req,
            requestedHours: req.requestedHours ? Number(req.requestedHours) : null,
        }))
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

        return requests.map((req) => ({
            ...req,
            requestedHours: req.requestedHours ? Number(req.requestedHours) : null,
        }))
    } catch (error) {
        console.error("Error fetching all requests:", error)
        throw new Error("Failed to fetch requests")
    }
}
