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

export interface UserNotification {
    id: string
    type: string
    title: string
    message: string
    url: string | null
    read: boolean
    createdAt: Date
}

export interface NotificationData {
    count: number
    pendingRequests: PendingRequestNotification[]
    notifications: UserNotification[]
    unreadCount: number
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

        const pendingNotifications: PendingRequestNotification[] = pendingRequests.map((req) => ({
            id: req.id,
            type: req.type,
            startDate: req.startDate,
            endDate: req.endDate,
            userName: req.user.name || req.user.email,
            userEmail: req.user.email,
            createdAt: req.createdAt,
        }))

        const pendingCount = await prisma.request.count({
            where: {
                status: "PENDING",
                ...(!isAdmin && { userId: session.user.id }),
            },
        })

        const userNotifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id,
            },
            select: {
                id: true,
                type: true,
                title: true,
                message: true,
                url: true,
                read: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 50,
        })

        const notifications: UserNotification[] = userNotifications.map((notif) => ({
            id: notif.id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            url: notif.url,
            read: notif.read,
            createdAt: notif.createdAt,
        }))

        const unreadCount = await prisma.notification.count({
            where: {
                userId: session.user.id,
                read: false,
            },
        })

        return {
            count: pendingCount,
            pendingRequests: pendingNotifications,
            notifications,
            unreadCount,
            isAdmin,
        }
    } catch (error) {
        console.error("Error fetching notifications:", error)
        return { count: 0, pendingRequests: [], notifications: [], unreadCount: 0, isAdmin: false }
    }
}

export async function getUnreadNotificationCount(): Promise<{ count: number }> {
    try {
        const session = await requireAuth()

        const count = await prisma.notification.count({
            where: {
                userId: session.user.id,
                read: false,
            },
        })

        return { count }
    } catch (error) {
        console.error("Error fetching unread count:", error)
        return { count: 0 }
    }
}

export async function markNotificationsAsRead(notificationIds: string[]) {
    try {
        const session = await requireAuth()

        await prisma.notification.updateMany({
            where: {
                id: { in: notificationIds },
                userId: session.user.id,
            },
            data: {
                read: true,
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Error marking notifications as read:", error)
        return { error: "Failed to mark notifications as read" }
    }
}

export async function cleanupOldNotifications() {
    try {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        const result = await prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: ninetyDaysAgo,
                },
            },
        })

        console.log(`Cleaned up ${result.count} old notifications`)
        return { success: true, deleted: result.count }
    } catch (error) {
        console.error("Error cleaning up old notifications:", error)
        return { error: "Failed to cleanup notifications" }
    }
}
