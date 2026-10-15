import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { getTodayDate, APP_TIMEZONE } from "@/lib/utils"
import {
    sendCheckinReminder,
    sendCheckoutReminder,
    processAutoCheckin,
    processAutoCheckout,
} from "@/app/(protected)/urnik-net-overview/_actions/auto-clock-actions"

function parseTimeToDate(timeString: string, timeZone: string): Date {
    const [hours, minutes] = timeString.split(":").map(Number)
    const nowInZone = toZonedTime(new Date(), timeZone)
    const wallDate = new Date(
        nowInZone.getFullYear(),
        nowInZone.getMonth(),
        nowInZone.getDate(),
        hours,
        minutes,
        0,
        0
    )
    return fromZonedTime(wallDate, timeZone)
}

function shouldTrigger(triggerTime: Date | null, lastFired: Date | null): boolean {
    if (!triggerTime) return false
    const now = new Date()
    if (now < triggerTime) return false
    const fifteenMinutesAfterTrigger = new Date(triggerTime.getTime() + 15 * 60 * 1000)
    if (now > fifteenMinutesAfterTrigger) return false
    if (!lastFired) return true
    return lastFired < triggerTime && now >= triggerTime
}

function isTodayInTimeZone(date: Date, timeZone: string): boolean {
    const nowInZone = toZonedTime(new Date(), timeZone)
    const dateInZone = toZonedTime(date, timeZone)
    return (
        dateInZone.getFullYear() === nowInZone.getFullYear() &&
        dateInZone.getMonth() === nowInZone.getMonth() &&
        dateInZone.getDate() === nowInZone.getDate()
    )
}

export async function POST(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
        return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
    }

    const authHeader = request.headers.get("authorization")
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = getTodayDate()

    const todayHoliday = await prisma.holiday.findFirst({
        where: { date: today },
    })

    if (todayHoliday) {
        return NextResponse.json({ success: true, processed: 0, skippedReason: "holiday" })
    }

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { preferences: { autoCheckInEnabled: true } },
                { preferences: { autoCheckOutEnabled: true } },
            ],
        },
        select: {
            id: true,
            workStartTime: true,
            workEndTime: true,
            timeZone: true,
            preferences: {
                select: {
                    autoCheckInEnabled: true,
                    autoCheckOutEnabled: true,
                },
            },
            workDays: {
                select: { dayOfWeek: true },
            },
            workTimeAdjustments: {
                where: { date: today },
            },
            requests: {
                where: {
                    startDate: { lte: today },
                    endDate: { gte: today },
                    status: "APPROVED",
                    type: { in: ["VACATION", "SICK_LEAVE"] },
                },
                take: 1,
            },
        },
    })

    const errors: string[] = []

    for (const user of users) {
        await new Promise((resolve) => setTimeout(resolve, 500))

        const timeZone = user.timeZone || APP_TIMEZONE
        const nowInZone = toZonedTime(new Date(), timeZone)
        const todayDayOfWeek = nowInZone.getDay()

        const workDays: number[] =
            user.workDays.length > 0 ? user.workDays.map((r) => r.dayOfWeek) : [1, 2, 3, 4, 5]

        if (!workDays.includes(todayDayOfWeek)) {
            continue
        }

        if (user.requests.length > 0) {
            continue
        }

        const adjustment = user.workTimeAdjustments[0]
        const effectiveStartTime = adjustment?.adjustedStartTime ?? user.workStartTime
        const effectiveEndTime = adjustment?.adjustedEndTime ?? user.workEndTime

        const checkinTime =
            user.preferences?.autoCheckInEnabled && effectiveStartTime
                ? parseTimeToDate(effectiveStartTime, timeZone)
                : null
        const checkinReminderTime = checkinTime
            ? new Date(checkinTime.getTime() - 15 * 60 * 1000)
            : null
        const checkoutTime =
            user.preferences?.autoCheckOutEnabled && effectiveEndTime
                ? parseTimeToDate(effectiveEndTime, timeZone)
                : null
        const checkoutReminderTime = checkoutTime
            ? new Date(checkoutTime.getTime() - 15 * 60 * 1000)
            : null

        const state = await prisma.autoClockState.upsert({
            where: { userId: user.id },
            update: {},
            create: { userId: user.id },
        })

        const clockedInToday =
            state.clockedInAt !== null && isTodayInTimeZone(state.clockedInAt, timeZone)
        const clockedOutToday =
            state.clockedOutAt !== null && isTodayInTimeZone(state.clockedOutAt, timeZone)

        if (!clockedInToday && shouldTrigger(checkinReminderTime, state.checkinReminderFiredAt)) {
            const result = await sendCheckinReminder(user.id)
            if (result.success) {
                await prisma.autoClockState.update({
                    where: { userId: user.id },
                    data: { checkinReminderFiredAt: new Date() },
                })
            } else {
                errors.push(`checkin-reminder ${user.id}: ${result.error}`)
            }
        }

        const alreadyCheckedInToday =
            clockedInToday ||
            (state.checkinFiredAt !== null &&
                checkinTime !== null &&
                isTodayInTimeZone(state.checkinFiredAt, timeZone))

        if (!alreadyCheckedInToday && shouldTrigger(checkinTime, state.checkinFiredAt)) {
            const result = await processAutoCheckin(user.id)
            await prisma.autoClockState.update({
                where: { userId: user.id },
                data: { checkinFiredAt: new Date() },
            })
            if (!result.success) {
                errors.push(`checkin ${user.id}: ${result.error}`)
            }
        }

        if (
            !clockedOutToday &&
            shouldTrigger(checkoutReminderTime, state.checkoutReminderFiredAt)
        ) {
            const result = await sendCheckoutReminder(user.id)
            if (result.success) {
                await prisma.autoClockState.update({
                    where: { userId: user.id },
                    data: { checkoutReminderFiredAt: new Date() },
                })
            } else {
                errors.push(`checkout-reminder ${user.id}: ${result.error}`)
            }
        }

        if (!clockedOutToday && shouldTrigger(checkoutTime, state.checkoutFiredAt)) {
            const result = await processAutoCheckout(user.id)
            await prisma.autoClockState.update({
                where: { userId: user.id },
                data: { checkoutFiredAt: new Date() },
            })
            if (!result.success) {
                errors.push(`checkout ${user.id}: ${result.error}`)
            }
        }
    }

    return NextResponse.json({
        success: true,
        processed: users.length,
        ...(errors.length > 0 && { errors }),
    })
}
