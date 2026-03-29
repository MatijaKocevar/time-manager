import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { z } from "zod"

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

        const timeToAdjust = type === "start" ? user.workStartTime : user.workEndTime
        if (!timeToAdjust) {
            return NextResponse.json({ error: `Work ${type} time not configured` }, { status: 400 })
        }

        const [hours, minutes] = timeToAdjust.split(":").map(Number)
        const newMinutes = minutes + delayMinutes
        const extraHours = Math.floor(newMinutes / 60)
        const finalMinutes = newMinutes % 60
        const finalHours = (hours + extraHours) % 24

        const adjustedTime = `${String(finalHours).padStart(2, "0")}:${String(finalMinutes).padStart(2, "0")}`

        const updateData =
            type === "start"
                ? { adjustedStartTime: adjustedTime }
                : { adjustedEndTime: adjustedTime }

        await prisma.workTimeAdjustment.upsert({
            where: {
                userId_date: {
                    userId: session.user.id,
                    date: today,
                },
            },
            create: {
                userId: session.user.id,
                date: today,
                ...updateData,
            },
            update: updateData,
        })

        return NextResponse.json({
            success: true,
            message: `Work ${type} time delayed by ${delayMinutes} minutes`,
            adjustedTime,
        })
    } catch (error) {
        console.error("Error adjusting work time:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
