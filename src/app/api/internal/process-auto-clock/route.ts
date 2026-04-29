import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fromZonedTime, toZonedTime } from "date-fns-tz"
import {
    sendCheckinReminder,
    sendCheckoutReminder,
    processAutoCheckin,
    processAutoCheckout,
} from "@/app/(protected)/urnik-net-overview/actions/auto-clock-actions"

const TIMEZONE = "Europe/Ljubljana"

function parseTimeToDate(timeString: string): Date {
    const [hours, minutes] = timeString.split(":").map(Number)
    const nowUtc = new Date()
    const year = nowUtc.getUTCFullYear()
    const month = nowUtc.getUTCMonth()
    const day = nowUtc.getUTCDate()
    const ljubljanaDate = new Date(year, month, day, hours, minutes, 0, 0)
    return fromZonedTime(ljubljanaDate, TIMEZONE)
}

function shouldTrigger(triggerTime: Date | null, lastChecked: Date | null): boolean {
    if (!triggerTime) return false
    const now = new Date()
    if (now < triggerTime) return false
    const fifteenMinutesAfterTrigger = new Date(triggerTime.getTime() + 15 * 60 * 1000)
    if (now > fifteenMinutesAfterTrigger) return false
    if (!lastChecked) return true
    return lastChecked < triggerTime && now >= triggerTime
}

function getTodayDate(): Date {
    const nowInLjubljana = toZonedTime(new Date(), TIMEZONE)
    return new Date(
        Date.UTC(nowInLjubljana.getFullYear(), nowInLjubljana.getMonth(), nowInLjubljana.getDate())
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
            preferences: {
                select: {
                    autoCheckInEnabled: true,
                    autoCheckOutEnabled: true,
                },
            },
            workTimeAdjustments: {
                where: { date: today },
            },
        },
    })

    const errors: string[] = []

    for (const user of users) {
        await new Promise((resolve) => setTimeout(resolve, 500))

        const adjustment = user.workTimeAdjustments[0]
        const effectiveStartTime = adjustment?.adjustedStartTime ?? user.workStartTime
        const effectiveEndTime = adjustment?.adjustedEndTime ?? user.workEndTime

        const checkinTime =
            user.preferences?.autoCheckInEnabled && effectiveStartTime
                ? parseTimeToDate(effectiveStartTime)
                : null
        const checkinReminderTime = checkinTime
            ? new Date(checkinTime.getTime() - 15 * 60 * 1000)
            : null
        const checkoutTime =
            user.preferences?.autoCheckOutEnabled && effectiveEndTime
                ? parseTimeToDate(effectiveEndTime)
                : null
        const checkoutReminderTime = checkoutTime
            ? new Date(checkoutTime.getTime() - 15 * 60 * 1000)
            : null

        const log = await prisma.autoClockLog.upsert({
            where: { userId_date: { userId: user.id, date: today } },
            update: {},
            create: { userId: user.id, date: today },
        })

        if (!log.clockedInAt && shouldTrigger(checkinReminderTime, log.checkinReminderFiredAt)) {
            const result = await sendCheckinReminder(user.id)
            if (result.success) {
                await prisma.autoClockLog.update({
                    where: { userId_date: { userId: user.id, date: today } },
                    data: { checkinReminderFiredAt: new Date() },
                })
            } else {
                errors.push(`checkin-reminder ${user.id}: ${result.error}`)
            }
        }

        const alreadyCheckedInToday =
            log.clockedInAt !== null ||
            (log.checkinFiredAt !== null &&
                checkinTime !== null &&
                log.checkinFiredAt >= checkinTime)

        if (!alreadyCheckedInToday && shouldTrigger(checkinTime, log.checkinFiredAt)) {
            const result = await processAutoCheckin(user.id)
            await prisma.autoClockLog.update({
                where: { userId_date: { userId: user.id, date: today } },
                data: { checkinFiredAt: new Date() },
            })
            if (!result.success) {
                errors.push(`checkin ${user.id}: ${result.error}`)
            }
        }

        if (!log.clockedOutAt && shouldTrigger(checkoutReminderTime, log.checkoutReminderFiredAt)) {
            const result = await sendCheckoutReminder(user.id)
            if (result.success) {
                await prisma.autoClockLog.update({
                    where: { userId_date: { userId: user.id, date: today } },
                    data: { checkoutReminderFiredAt: new Date() },
                })
            } else {
                errors.push(`checkout-reminder ${user.id}: ${result.error}`)
            }
        }

        const alreadyCheckedOutToday = log.clockedOutAt !== null

        if (!alreadyCheckedOutToday && shouldTrigger(checkoutTime, log.checkoutFiredAt)) {
            const result = await processAutoCheckout(user.id)
            await prisma.autoClockLog.update({
                where: { userId_date: { userId: user.id, date: today } },
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
