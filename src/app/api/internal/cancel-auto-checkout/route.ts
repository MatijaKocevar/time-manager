import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"

export async function POST(request: NextRequest) {
    try {
        const cronSecret = request.headers.get("x-cron-secret")
        const validCronSecret = process.env.CRON_SECRET

        let userId: string | null = null

        if (cronSecret && cronSecret === validCronSecret) {
            const body = await request.json()
            userId = body.userId
        } else {
            const session = await getServerSession(authConfig)
            if (!session?.user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
            }
            userId = session.user.id
        }

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

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

        return NextResponse.json({ success: true, message: "Auto checkout cancelled" })
    } catch (error) {
        console.error("Error cancelling auto checkout:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
