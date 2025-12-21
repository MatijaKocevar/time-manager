"use server"

import * as webpush from "web-push"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

webpush.setVapidDetails(
    "mailto:noreply@timemanager.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
)

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

export async function sendPushToAdmins(payload: {
    title: string
    body: string
    icon?: string
    url?: string
}) {
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
