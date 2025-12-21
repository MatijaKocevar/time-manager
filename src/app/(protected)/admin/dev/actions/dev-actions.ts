"use server"

import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/notifications/email"
import { newRequestForAdminsEmail } from "@/lib/notifications/email-templates"
import {
    sendPushNotification,
    sendPushToAdmins,
} from "@/app/(protected)/profile/actions/notification-actions"
import { authConfig } from "@/lib/auth"

async function requireAdmin() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    if (session.user.role !== "ADMIN") {
        throw new Error("Admin access required")
    }

    return session
}

export async function testEmailAction(email: string) {
    await requireAdmin()

    try {
        const result = await sendEmail(
            email,
            "Test Notification - Time Manager",
            newRequestForAdminsEmail(
                {
                    userName: "Test User",
                    requestType: "VACATION",
                    startDate: new Date("2025-12-25"),
                    endDate: new Date("2025-12-27"),
                    reason: "This is a test notification from the notification system",
                },
                "en"
            )
        )

        if (result.success) {
            return { success: true, message: `Email sent successfully to ${email}` }
        } else {
            return { success: false, error: result.error || "Failed to send email" }
        }
    } catch (error) {
        console.error("Error in testEmailAction:", error)
        return { success: false, error: "Failed to send test email" }
    }
}

export async function testPushAction(userId: string) {
    await requireAdmin()

    try {
        const result = await sendPushNotification(userId, {
            title: "Test Push Notification",
            body: "This is a test notification from the Time Manager notification system",
            url: "/requests",
        })

        if (result.success) {
            return {
                success: true,
                message: `Push notification sent to ${result.sent} subscription(s)`,
                sent: result.sent,
            }
        } else {
            return { success: false, error: result.error || "Failed to send push notification" }
        }
    } catch (error) {
        console.error("Error in testPushAction:", error)
        return { success: false, error: "Failed to send test push notification" }
    }
}

export async function testPushToAdminsAction() {
    await requireAdmin()

    try {
        const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true, email: true, name: true },
        })

        const result = await sendPushToAdmins({
            title: "Test Admin Notification",
            body: "This is a test notification for all administrators",
            url: "/admin/pending-requests",
        })

        if (result.success) {
            return {
                success: true,
                message: `Sent to ${result.sent} admin(s) out of ${admins.length} total`,
                admins: admins.map((a) => ({ name: a.name || a.email, email: a.email })),
            }
        } else {
            return { success: false, error: result.error || "Failed to send push to admins" }
        }
    } catch (error) {
        console.error("Error in testPushToAdminsAction:", error)
        return { success: false, error: "Failed to send test push to admins" }
    }
}

export async function simulateRequestFlowAction(userEmail: string) {
    await requireAdmin()

    try {
        const testUser = await prisma.user.findUnique({
            where: { email: userEmail },
            select: { id: true, name: true, email: true },
        })

        if (!testUser) {
            return { success: false, error: `User with email ${userEmail} not found` }
        }

        await sendEmail(
            userEmail,
            "Test: New Request Created",
            newRequestForAdminsEmail(
                {
                    userName: testUser.name || "Test User",
                    requestType: "VACATION",
                    startDate: new Date("2025-12-25"),
                    endDate: new Date("2025-12-27"),
                    reason: "Simulated test request",
                },
                "en"
            )
        )

        await sendPushToAdmins({
            title: "New Time-Off Request (Test)",
            body: `${testUser.name || testUser.email} has submitted a test vacation request`,
            url: "/admin/pending-requests",
        })

        await sendPushNotification(testUser.id, {
            title: "Request Approved ✓ (Test)",
            body: "Your test vacation request has been approved",
            url: "/requests",
        })

        await sendPushNotification(testUser.id, {
            title: "Request Rejected (Test)",
            body: "Your test vacation request has been rejected",
            url: "/requests",
        })

        return {
            success: true,
            message: `Complete flow simulation sent for ${testUser.name || testUser.email}`,
            steps: [
                "New request notification to admins (email + push)",
                "Approval notification to user (push)",
                "Rejection notification to user (push)",
            ],
        }
    } catch (error) {
        console.error("Error in simulateRequestFlowAction:", error)
        return { success: false, error: "Failed to simulate request flow" }
    }
}

export async function listSubscriptionsAction() {
    await requireAdmin()

    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            include: {
                user: {
                    select: { name: true, email: true, role: true },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return {
            success: true,
            subscriptions: subscriptions.map((sub) => ({
                id: sub.id,
                userId: sub.userId,
                userName: sub.user.name || sub.user.email,
                userEmail: sub.user.email,
                userRole: sub.user.role,
                endpoint: sub.endpoint.substring(0, 50) + "...",
                createdAt: sub.createdAt.toISOString(),
            })),
            count: subscriptions.length,
        }
    } catch (error) {
        console.error("Error in listSubscriptionsAction:", error)
        return { success: false, error: "Failed to list subscriptions" }
    }
}
