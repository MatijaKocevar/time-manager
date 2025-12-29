"use server"

import * as webpush from "web-push"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { UpdateNotificationPreferencesSchema } from "../schemas/notification-schemas"
import type { UpdateNotificationPreferencesInput } from "../schemas/notification-schemas"

let vapidConfigured = false

function ensureVapidDetails() {
    if (vapidConfigured) return true

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY

    if (!publicKey || !privateKey) {
        return false
    }

    try {
        webpush.setVapidDetails("mailto:noreply@timemanager.com", publicKey, privateKey)
        vapidConfigured = true
        return true
    } catch (error) {
        console.error("Failed to configure VAPID details:", error)
        return false
    }
}

const PushSubscriptionSchema = z.object({
    endpoint: z.string().url(),
    keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
    }),
})

type PushSubscriptionInput = z.infer<typeof PushSubscriptionSchema>

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

export async function subscribeUser(subscription: PushSubscriptionInput) {
    const session = await requireAuth()

    const validation = PushSubscriptionSchema.safeParse(subscription)
    if (!validation.success) {
        return { error: "Invalid subscription data" }
    }

    const { endpoint, keys } = validation.data

    try {
        await prisma.pushSubscription.upsert({
            where: { endpoint },
            update: {
                p256dh: keys.p256dh,
                auth: keys.auth,
            },
            create: {
                userId: session.user.id,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Error saving push subscription:", error)
        return { error: "Failed to save subscription" }
    }
}

export async function unsubscribeUser() {
    const session = await requireAuth()

    try {
        await prisma.pushSubscription.deleteMany({
            where: { userId: session.user.id },
        })

        return { success: true }
    } catch (error) {
        console.error("Error removing push subscription:", error)
        return { error: "Failed to unsubscribe" }
    }
}

export async function sendPushNotification(
    userId: string,
    payload: {
        title: string
        body: string
        icon?: string
        url?: string
    }
) {
    if (!ensureVapidDetails()) {
        console.warn("VAPID not configured, skipping push notification")
        return { success: false, error: "Push notifications not configured" }
    }

    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
        })

        if (subscriptions.length === 0) {
            return { success: true, sent: 0 }
        }

        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth,
                            },
                        },
                        JSON.stringify({
                            title: payload.title,
                            body: payload.body,
                            icon: payload.icon || "/icon-192x192.png",
                            url: payload.url || "/",
                        })
                    )
                } catch (error: unknown) {
                    if (error && typeof error === "object" && "statusCode" in error) {
                        const statusCode = (error as { statusCode: number }).statusCode
                        if (statusCode === 404 || statusCode === 410) {
                            await prisma.pushSubscription.delete({
                                where: { id: sub.id },
                            })
                        }
                    }
                    throw error
                }
            })
        )

        const successCount = results.filter((r) => r.status === "fulfilled").length

        return { success: true, sent: successCount }
    } catch (error) {
        console.error("Error sending push notification:", error)
        return { error: "Failed to send notification" }
    }
}

export async function hasUserSubscription() {
    const session = await requireAuth()

    try {
        const count = await prisma.pushSubscription.count({
            where: { userId: session.user.id },
        })

        return { hasSubscription: count > 0 }
    } catch (error) {
        console.error("Error checking push subscription:", error)
        return { hasSubscription: false }
    }
}

export async function sendPushToAdmins(payload: {
    title: string
    body: string
    icon?: string
    url?: string
}) {
    if (!ensureVapidDetails()) {
        console.warn("VAPID not configured, skipping push notification")
        return { success: false, error: "Push notifications not configured" }
    }

    try {
        const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true },
        })

        const results = await Promise.allSettled(
            admins.map((admin) => sendPushNotification(admin.id, payload))
        )

        const successCount = results.filter((r) => r.status === "fulfilled").length

        return { success: true, sent: successCount }
    } catch (error) {
        console.error("Error sending push to admins:", error)
        return { error: "Failed to send notifications" }
    }
}

export async function getNotificationPreferences() {
    const session = await requireAuth()

    try {
        let preferences = await prisma.notificationPreference.findUnique({
            where: { userId: session.user.id },
        })

        if (!preferences) {
            preferences = await prisma.notificationPreference.create({
                data: { userId: session.user.id },
            })
        }

        return { preferences }
    } catch (error) {
        console.error("Error fetching notification preferences:", error)
        return { error: "Failed to fetch preferences" }
    }
}

export async function updateNotificationPreferences(input: UpdateNotificationPreferencesInput) {
    const session = await requireAuth()

    const validation = UpdateNotificationPreferencesSchema.safeParse(input)
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    try {
        const preferences = await prisma.notificationPreference.upsert({
            where: { userId: session.user.id },
            update: validation.data,
            create: {
                userId: session.user.id,
                ...validation.data,
            },
        })

        return { success: true, preferences }
    } catch (error) {
        console.error("Error updating notification preferences:", error)
        return { error: "Failed to update preferences" }
    }
}
