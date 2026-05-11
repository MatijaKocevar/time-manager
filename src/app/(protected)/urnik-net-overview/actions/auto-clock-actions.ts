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
import { sendPushNotification } from "@/features/notifications/actions/notification-actions"
import { toZonedTime } from "date-fns-tz"

const TIMEZONE = "Europe/Ljubljana"

function getTodayUtc(): Date {
    const nowInLjubljana = toZonedTime(new Date(), TIMEZONE)
    return new Date(
        Date.UTC(nowInLjubljana.getFullYear(), nowInLjubljana.getMonth(), nowInLjubljana.getDate())
    )
}

interface ActionResult {
    success: boolean
    error?: string
    message?: string
}

export async function sendCheckinReminder(userId: string): Promise<ActionResult> {
    try {
        const today = getTodayUtc()

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
                workTimeAdjustments: {
                    where: { date: today },
                    take: 1,
                },
            },
        })

        if (!user?.preferences?.autoCheckInEnabled) {
            return { success: false, error: "Auto check-in not enabled" }
        }

        if (!user.workStartTime) {
            return { success: false, error: "Work start time not configured" }
        }

        const effectiveStartTime =
            user.workTimeAdjustments[0]?.adjustedStartTime ?? user.workStartTime

        await notifyAutoCheckinReminder({
            userId,
            userName: user.name || "User",
            workStartTime: effectiveStartTime,
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
        const today = getTodayUtc()

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
                workTimeAdjustments: {
                    where: { date: today },
                    take: 1,
                },
            },
        })

        if (!user?.preferences?.autoCheckOutEnabled) {
            return { success: false, error: "Auto check-out not enabled" }
        }

        if (!user.workEndTime) {
            return { success: false, error: "Work end time not configured" }
        }

        const effectiveEndTime = user.workTimeAdjustments[0]?.adjustedEndTime ?? user.workEndTime

        await notifyAutoCheckoutReminder({
            userId,
            userName: user.name || "User",
            workEndTime: effectiveEndTime,
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

        const isDryRun = process.env.AUTO_CLOCK_DRY_RUN === "true"

        if (!isDryRun && (!user.urnikUsername || !user.urnikPassword)) {
            return { success: false, error: "Urnik credentials not configured" }
        }

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

        if (isDryRun) {
            const time = new Date().toLocaleTimeString("sl-SI", {
                timeZone: "Europe/Ljubljana",
                hour: "2-digit",
                minute: "2-digit",
            })
            await sendPushNotification(userId, {
                title: "DRY RUN: Auto Check-In",
                body: `Would have checked in${isWorkFromHome ? " from home" : " at office"} at ${time}`,
                url: "/urnik-net-overview",
            })
            return { success: true, message: "Dry run: auto check-in simulated" }
        }

        const cookie = await getUrnikCookieForUser(userId)
        if (!cookie) {
            return { success: false, error: "Failed to authenticate with urnik.net" }
        }

        const clockInResult = await performClockInWithCookie(cookie, isWorkFromHome)

        if (!clockInResult.success) {
            return { success: false, error: clockInResult.error || "Failed to clock in" }
        }

        await prisma.autoClockState.upsert({
            where: { userId },
            create: { userId, clockedInAt: new Date() },
            update: { clockedInAt: new Date() },
        })

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

        const isDryRun = process.env.AUTO_CLOCK_DRY_RUN === "true"

        if (!isDryRun && (!user.urnikUsername || !user.urnikPassword)) {
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

        if (isDryRun) {
            const time = new Date().toLocaleTimeString("sl-SI", {
                timeZone: "Europe/Ljubljana",
                hour: "2-digit",
                minute: "2-digit",
            })
            await sendPushNotification(userId, {
                title: "DRY RUN: Auto Check-Out",
                body: `Would have checked out at ${time}`,
                url: "/urnik-net-overview",
            })
            return { success: true, message: "Dry run: auto check-out simulated" }
        }

        const cookie = await getUrnikCookieForUser(userId)
        if (!cookie) {
            return { success: false, error: "Failed to authenticate with urnik.net" }
        }

        const clockOutResult = await performClockOutWithCookie(cookie)

        if (!clockOutResult.success) {
            return { success: false, error: clockOutResult.error || "Failed to clock out" }
        }

        await prisma.autoClockState.upsert({
            where: { userId },
            create: { userId, clockedOutAt: new Date() },
            update: { clockedOutAt: new Date() },
        })

        await prisma.workTimeAdjustment.deleteMany({
            where: { userId, date: today },
        })

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
