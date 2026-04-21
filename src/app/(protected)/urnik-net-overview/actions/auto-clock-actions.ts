"use server"

import { prisma } from "@/lib/prisma"
import { performClockInWithCookie, performClockOutWithCookie } from "./clock-actions"
import {
    notifyAutoCheckinReminder,
    notifyAutoCheckinCompleted,
    notifyAutoCheckoutReminder,
    notifyAutoCheckoutCompleted,
} from "@/features/notifications/lib/notify"
import { getUrnikCookieForUser } from "@/lib/urnik-session"
import { requireAuth } from "@/lib/auth-helpers"

interface ActionResult {
    success: boolean
    error?: string
    message?: string
}

export async function sendCheckinReminder(userId: string): Promise<ActionResult> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                workStartTime: true,
                preferences: {
                    select: {
                        autoCheckInEnabled: true,
                    },
                },
            },
        })

        if (!user?.preferences?.autoCheckInEnabled) {
            return { success: false, error: "Auto check-in not enabled" }
        }

        if (!user.workStartTime) {
            return { success: false, error: "Work start time not configured" }
        }

        await notifyAutoCheckinReminder({
            userId,
            userName: user.name || "User",
            workStartTime: user.workStartTime,
        })

        return { success: true, message: "Check-in reminder sent" }
    } catch (error) {
        console.error("Error sending check-in reminder:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

export async function sendCheckoutReminder(userId: string): Promise<ActionResult> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                workEndTime: true,
                preferences: {
                    select: {
                        autoCheckOutEnabled: true,
                    },
                },
            },
        })

        if (!user?.preferences?.autoCheckOutEnabled) {
            return { success: false, error: "Auto check-out not enabled" }
        }

        if (!user.workEndTime) {
            return { success: false, error: "Work end time not configured" }
        }

        await notifyAutoCheckoutReminder({
            userId,
            userName: user.name || "User",
            workEndTime: user.workEndTime,
        })

        return { success: true, message: "Check-out reminder sent" }
    } catch (error) {
        console.error("Error sending check-out reminder:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

export async function processAutoCheckin(userId: string): Promise<ActionResult> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                urnikUsername: true,
                urnikPassword: true,
                preferences: {
                    select: {
                        autoCheckInEnabled: true,
                    },
                },
            },
        })

        if (!user?.preferences?.autoCheckInEnabled) {
            return { success: false, error: "Auto check-in not enabled" }
        }

        if (!user.urnikUsername || !user.urnikPassword) {
            return { success: false, error: "Urnik credentials not configured" }
        }

        const cookie = await getUrnikCookieForUser(userId)
        if (!cookie) {
            return { success: false, error: "Failed to authenticate with urnik.net" }
        }

        // Check if user has approved WORK_FROM_HOME request for today
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const wfhRequest = await prisma.request.findFirst({
            where: {
                userId,
                startDate: { lte: today },
                endDate: { gte: today },
                type: "WORK_FROM_HOME",
                status: "APPROVED",
            },
        })

        const isWorkFromHome = !!wfhRequest
        const clockInResult = await performClockInWithCookie(cookie, isWorkFromHome)

        if (!clockInResult.success) {
            return { success: false, error: clockInResult.error || "Failed to clock in" }
        }

        await notifyAutoCheckinCompleted({
            userId,
            userName: user.name || "User",
            isWorkFromHome,
        })

        return { success: true, message: "Auto check-in completed successfully" }
    } catch (error) {
        console.error("Error processing auto check-in:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

export async function processAutoCheckout(userId: string): Promise<ActionResult> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                urnikUsername: true,
                urnikPassword: true,
                preferences: {
                    select: {
                        autoCheckOutEnabled: true,
                    },
                },
            },
        })

        if (!user?.preferences?.autoCheckOutEnabled) {
            return { success: false, error: "Auto check-out not enabled" }
        }

        if (!user.urnikUsername || !user.urnikPassword) {
            return { success: false, error: "Urnik credentials not configured" }
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const cancellation = await prisma.autoCheckoutCancellation.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: today,
                },
            },
        })

        if (cancellation) {
            return { success: false, error: "Auto check-out cancelled for today" }
        }

        const cookie = await getUrnikCookieForUser(userId)
        if (!cookie) {
            return { success: false, error: "Failed to authenticate with urnik.net" }
        }

        const clockOutResult = await performClockOutWithCookie(cookie)

        if (!clockOutResult.success) {
            return { success: false, error: clockOutResult.error || "Failed to clock out" }
        }

        await notifyAutoCheckoutCompleted({ userId, userName: user.name || "User" })

        return { success: true, message: "Auto check-out completed successfully" }
    } catch (error) {
        console.error("Error processing auto check-out:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

export async function cancelAutoCheckout(): Promise<ActionResult> {
    try {
        const session = await requireAuth()
        const userId = session.user.id

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        await prisma.autoCheckoutCancellation.upsert({
            where: {
                userId_date: {
                    userId,
                    date: today,
                },
            },
            create: {
                userId,
                date: today,
            },
            update: {},
        })

        return { success: true, message: "Auto check-out cancelled for today" }
    } catch (error) {
        console.error("Error cancelling auto check-out:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}
