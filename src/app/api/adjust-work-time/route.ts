import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { z } from "zod"
import { getTodayDate } from "@/lib/utils"

const AdjustTimeSchema = z.object({
    adjustedStartTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .optional(),
    adjustedEndTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .optional(),
    date: z.string().optional(),
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authConfig)
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const validation = AdjustTimeSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.error.issues },
                { status: 400 }
            )
        }

        const { adjustedStartTime, adjustedEndTime, date: dateStr } = validation.data

        if (!adjustedStartTime && !adjustedEndTime) {
            return NextResponse.json(
                { error: "At least one time adjustment is required" },
                { status: 400 }
            )
        }

        const targetDate = dateStr ? new Date(dateStr) : getTodayDate()
        targetDate.setHours(0, 0, 0, 0)

        await prisma.workTimeAdjustment.upsert({
            where: {
                userId_date: {
                    userId: session.user.id,
                    date: targetDate,
                },
            },
            create: {
                userId: session.user.id,
                date: targetDate,
                adjustedStartTime,
                adjustedEndTime,
            },
            update: {
                adjustedStartTime,
                adjustedEndTime,
            },
        })

        return NextResponse.json({
            success: true,
            message: "Work time adjusted successfully",
            adjustedStartTime,
            adjustedEndTime,
        })
    } catch (error) {
        console.error("Error adjusting work time:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}

export async function DELETE() {
    try {
        const session = await getServerSession(authConfig)
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const today = getTodayDate()

        await prisma.workTimeAdjustment.deleteMany({
            where: {
                userId: session.user.id,
                date: today,
            },
        })

        return NextResponse.json({
            success: true,
            message: "Work time adjustment cleared",
        })
    } catch (error) {
        console.error("Error clearing work time adjustment:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
