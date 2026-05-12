import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { z } from "zod"
import { fromZonedTime } from "date-fns-tz"

const TIMEZONE = "Europe/Ljubljana"

function parseTimeToDate(timeString: string): Date {
    const [hours, minutes] = timeString.split(":").map(Number)
    const nowUtc = new Date()
    const ljubljanaDate = new Date(
        nowUtc.getUTCFullYear(),
        nowUtc.getUTCMonth(),
        nowUtc.getUTCDate(),
        hours,
        minutes,
        0,
        0
    )
    return fromZonedTime(ljubljanaDate, TIMEZONE)
}

const QuickAdjustSchema = z.object({
    delayMinutes: z.number().int().min(1).max(120),
    type: z.enum(["start", "end"]),
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authConfig)
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const validation = QuickAdjustSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.error.issues },
                { status: 400 }
            )
        }

        const { delayMinutes, type } = validation.data

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                workStartTime: true,
                workEndTime: true,
            },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const addMinutes = (time: string, minutes: number): string => {
            const [h, m] = time.split(":").map(Number)
            const total = h * 60 + m + minutes
            return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
        }

        if (type === "start") {
            if (!user.workStartTime) {
                return NextResponse.json(
                    { error: "Work start time not configured" },
                    { status: 400 }
                )
            }

            const existing = await prisma.workTimeAdjustment.findUnique({
                where: { userId_date: { userId: session.user.id, date: today } },
            })

            const baseStart = existing?.adjustedStartTime ?? user.workStartTime
            const baseEnd = existing?.adjustedEndTime ?? user.workEndTime

            const newStart = addMinutes(baseStart, delayMinutes)
            const newEnd = baseEnd ? addMinutes(baseEnd, delayMinutes) : undefined

            await prisma.workTimeAdjustment.upsert({
                where: { userId_date: { userId: session.user.id, date: today } },
                create: {
                    userId: session.user.id,
                    date: today,
                    adjustedStartTime: newStart,
                    ...(newEnd && { adjustedEndTime: newEnd }),
                },
                update: {
                    adjustedStartTime: newStart,
                    ...(newEnd && { adjustedEndTime: newEnd }),
                },
            })

            const newCheckinReminderTime = new Date(
                parseTimeToDate(newStart).getTime() - 15 * 60 * 1000
            )
            await prisma.autoClockState.upsert({
                where: { userId: session.user.id },
                update: { checkinReminderFiredAt: newCheckinReminderTime },
                create: { userId: session.user.id, checkinReminderFiredAt: newCheckinReminderTime },
            })

            return NextResponse.json({
                success: true,
                message: `Work times delayed by ${delayMinutes} minutes`,
                adjustedStartTime: newStart,
                adjustedEndTime: newEnd,
            })
        }

        if (!user.workEndTime) {
            return NextResponse.json({ error: "Work end time not configured" }, { status: 400 })
        }

        const existing = await prisma.workTimeAdjustment.findUnique({
            where: { userId_date: { userId: session.user.id, date: today } },
        })
        const baseEnd = existing?.adjustedEndTime ?? user.workEndTime
        const newEnd = addMinutes(baseEnd, delayMinutes)

        await prisma.workTimeAdjustment.upsert({
            where: { userId_date: { userId: session.user.id, date: today } },
            create: { userId: session.user.id, date: today, adjustedEndTime: newEnd },
            update: { adjustedEndTime: newEnd },
        })

        const newCheckoutReminderTime = new Date(parseTimeToDate(newEnd).getTime() - 15 * 60 * 1000)
        await prisma.autoClockState.upsert({
            where: { userId: session.user.id },
            update: { checkoutReminderFiredAt: newCheckoutReminderTime },
            create: {
                userId: session.user.id,
                checkoutReminderFiredAt: newCheckoutReminderTime,
            },
        })

        return NextResponse.json({
            success: true,
            message: `Work end time delayed by ${delayMinutes} minutes`,
            adjustedEndTime: newEnd,
        })
    } catch (error) {
        console.error("Error adjusting work time:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
