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
    isAdmin: boolean
}

export async function getNotifications(): Promise<NotificationData> {
    try {
        const session = await requireAuth()
        const isAdmin = session.user.role === "ADMIN"

        const pendingRequests = await prisma.request.findMany({
            where: {
                status: "PENDING",
                ...(!isAdmin && { userId: session.user.id }),
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
                ...(!isAdmin && { userId: session.user.id }),
            },
        })

        return { count, pendingRequests: notifications, isAdmin }
    } catch (error) {
        console.error("Error fetching notifications:", error)
        return { count: 0, pendingRequests: [], isAdmin: false }
    }
}
