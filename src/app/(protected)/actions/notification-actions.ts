"use server"

import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

export interface PendingRequestNotification {
    id: string
    type: string
    startDate: Date
    endDate: Date
    userName: string
    userEmail: string
    createdAt: Date
}

export interface NotificationData {
    count: number
    pendingRequests: PendingRequestNotification[]
}

export async function getNotifications(): Promise<NotificationData> {
    try {
        const session = await requireAuth()

        if (session.user.role !== "ADMIN") {
            return { count: 0, pendingRequests: [] }
        }

        const pendingRequests = await prisma.request.findMany({
            where: {
                status: "PENDING",
            },
            select: {
                id: true,
                type: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 5,
        })

        const notifications: PendingRequestNotification[] = pendingRequests.map((req) => ({
            id: req.id,
            type: req.type,
            startDate: req.startDate,
            endDate: req.endDate,
            userName: req.user.name || req.user.email,
            userEmail: req.user.email,
            createdAt: req.createdAt,
        }))

        const count = await prisma.request.count({
            where: {
                status: "PENDING",
            },
        })

        return { count, pendingRequests: notifications }
    } catch (error) {
        console.error("Error fetching notifications:", error)
        return { count: 0, pendingRequests: [] }
    }
}
