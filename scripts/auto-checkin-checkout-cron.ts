import "dotenv/config"
import { PrismaClient } from "../prisma/generated/client"
import { fromZonedTime } from "date-fns-tz"
import {
    sendCheckinReminder,
    sendCheckoutReminder,
    processAutoCheckin,
    processAutoCheckout,
} from "../src/app/(protected)/urnik-net-overview/actions/auto-clock-actions"

const prisma = new PrismaClient()

const CHECK_INTERVAL_MS = 60 * 1000

const TIMEZONE = "Europe/Ljubljana"

interface UserTrigger {
    userId: string
    userName: string
    checkinReminderTime: Date | null
    checkinTime: Date | null
    checkoutReminderTime: Date | null
    checkoutTime: Date | null
}

function parseTimeToDate(timeString: string): Date {
    const [hours, minutes] = timeString.split(":").map(Number)

    // Get today's date in UTC
    const nowUtc = new Date()
    const year = nowUtc.getUTCFullYear()
    const month = nowUtc.getUTCMonth()
    const day = nowUtc.getUTCDate()

    // Create a date object representing the time in Ljubljana timezone
    // We use the UTC date components to create a naive date, then interpret it as Ljubljana time
    const ljubljanaDate = new Date(year, month, day, hours, minutes, 0, 0)

    // Convert Ljubljana time to UTC using fromZonedTime
    const utcDate = fromZonedTime(ljubljanaDate, TIMEZONE)

    console.log(
        `[parseTimeToDate] Parsed "${timeString}" as ${ljubljanaDate.toLocaleString("sl-SI", { timeZone: TIMEZONE })} Ljubljana → ${utcDate.toISOString()} UTC`
    )

    return utcDate
}

function shouldTrigger(triggerTime: Date | null, lastChecked: Date | null): boolean {
    if (!triggerTime) return false
    const now = new Date()

    // Only trigger if current time is after trigger time
    if (now < triggerTime) return false

    // Only trigger if within 15 minutes of the trigger time
    // This prevents late triggering when cron restarts
    const fifteenMinutesAfterTrigger = new Date(triggerTime.getTime() + 15 * 60 * 1000)
    if (now > fifteenMinutesAfterTrigger) return false

    // If we haven't checked before, trigger
    if (!lastChecked) return true

    // Only trigger if we haven't triggered since the trigger time
    return lastChecked < triggerTime && now >= triggerTime
}

async function getUserTriggers(): Promise<UserTrigger[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { preferences: { autoCheckInEnabled: true } },
                { preferences: { autoCheckOutEnabled: true } },
            ],
        },
        select: {
            id: true,
            name: true,
            workStartTime: true,
            workEndTime: true,
            preferences: {
                select: {
                    autoCheckInEnabled: true,
                    autoCheckOutEnabled: true,
                },
            },
            workTimeAdjustments: {
                where: {
                    date: today,
                },
            },
        },
    })

    const triggers: UserTrigger[] = []

    for (const user of users) {
        let checkinReminderTime: Date | null = null
        let checkinTime: Date | null = null
        let checkoutReminderTime: Date | null = null
        let checkoutTime: Date | null = null

        const adjustment = user.workTimeAdjustments[0]
        const effectiveStartTime = adjustment?.adjustedStartTime || user.workStartTime
        const effectiveEndTime = adjustment?.adjustedEndTime || user.workEndTime

        if (user.preferences?.autoCheckInEnabled && effectiveStartTime) {
            checkinTime = parseTimeToDate(effectiveStartTime)
            checkinReminderTime = new Date(checkinTime.getTime() - 15 * 60 * 1000)
            console.log(
                `[getUserTriggers] User "${user.name}" check-in: ${effectiveStartTime} → reminder at ${checkinReminderTime.toISOString()}`
            )
        }

        if (user.preferences?.autoCheckOutEnabled && effectiveEndTime) {
            checkoutTime = parseTimeToDate(effectiveEndTime)
            checkoutReminderTime = new Date(checkoutTime.getTime() - 15 * 60 * 1000)
            console.log(
                `[getUserTriggers] User "${user.name}" check-out: ${effectiveEndTime} → reminder at ${checkoutReminderTime.toISOString()}`
            )
        }

        triggers.push({
            userId: user.id,
            userName: user.name || "User",
            checkinReminderTime,
            checkinTime,
            checkoutReminderTime,
            checkoutTime,
        })
    }

    return triggers
}

const lastCheckinReminder = new Map<string, Date>()
const lastCheckin = new Map<string, Date>()
const lastCheckoutReminder = new Map<string, Date>()
const lastCheckout = new Map<string, Date>()

async function processTriggers(): Promise<void> {
    try {
        const nowUtc = new Date()
        console.log(
            `[processTriggers] Checking triggers at ${nowUtc.toISOString()} UTC (${nowUtc.toLocaleString("sl-SI", { timeZone: TIMEZONE })} Ljubljana)`
        )

        const triggers = await getUserTriggers()

        for (const trigger of triggers) {
            if (
                shouldTrigger(
                    trigger.checkinReminderTime,
                    lastCheckinReminder.get(trigger.userId) || null
                )
            ) {
                console.log(
                    `[${new Date().toISOString()}] Sending check-in reminder to ${trigger.userName}`
                )
                const result = await sendCheckinReminder(trigger.userId)
                if (result.success) {
                    lastCheckinReminder.set(trigger.userId, new Date())
                } else {
                    console.error(`Failed to send check-in reminder: ${result.error}`)
                }
            }

            if (shouldTrigger(trigger.checkinTime, lastCheckin.get(trigger.userId) || null)) {
                console.log(
                    `[${new Date().toISOString()}] Processing auto check-in for ${trigger.userName}`
                )
                const result = await processAutoCheckin(trigger.userId)
                if (result.success) {
                    lastCheckin.set(trigger.userId, new Date())
                } else {
                    console.error(`Failed to process auto check-in: ${result.error}`)
                }
            }

            if (
                shouldTrigger(
                    trigger.checkoutReminderTime,
                    lastCheckoutReminder.get(trigger.userId) || null
                )
            ) {
                console.log(
                    `[${new Date().toISOString()}] Sending check-out reminder to ${trigger.userName}`
                )
                const result = await sendCheckoutReminder(trigger.userId)
                if (result.success) {
                    lastCheckoutReminder.set(trigger.userId, new Date())
                } else {
                    console.error(`Failed to send check-out reminder: ${result.error}`)
                }
            }

            if (shouldTrigger(trigger.checkoutTime, lastCheckout.get(trigger.userId) || null)) {
                console.log(
                    `[${new Date().toISOString()}] Processing auto check-out for ${trigger.userName}`
                )
                const result = await processAutoCheckout(trigger.userId)
                if (result.success) {
                    lastCheckout.set(trigger.userId, new Date())
                } else {
                    console.error(`Failed to process auto check-out: ${result.error}`)
                }
            }
        }
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error processing triggers:`, err)
    }
}

function resetDailyTracking() {
    const now = new Date()
    if (now.getHours() === 0 && now.getMinutes() < 2) {
        console.log(`[${new Date().toISOString()}] Resetting daily tracking`)
        lastCheckinReminder.clear()
        lastCheckin.clear()
        lastCheckoutReminder.clear()
        lastCheckout.clear()
    }
}

async function run(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Auto check-in/check-out cron started`)

    while (true) {
        resetDailyTracking()
        await processTriggers()
        await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL_MS))
    }
}

run().catch((err) => {
    console.error("Fatal error in auto check-in/check-out cron:", err)
    process.exit(1)
})
