import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
    getActiveTimer,
    startTimer,
    stopTimer,
} from "@/app/(protected)/shared/actions/timer-actions"
import { logoutOfUrnikNet } from "@/app/(protected)/urnik-net-overview/requests/actions/urnik-net-auth"
import { sendPushNotification } from "@/features/notifications/actions/notification-actions"
import { sendEmail } from "@/features/notifications/lib/email"

export async function GET(request: NextRequest) {
    const session = await getServerSession(authConfig)
    const token = request.nextUrl.searchParams.get("token")
    const tapUrl = `/api/tap-in${token ? `?token=${token}` : ""}`

    if (!session?.user) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("callbackUrl", tapUrl)
        return NextResponse.redirect(loginUrl)
    }

    const userId = session.user.id
    const activeTimer = await getActiveTimer()

    if (activeTimer) {
        const stopResult = await stopTimer({ id: activeTimer.id })

        if (stopResult.error) {
            return NextResponse.json({ success: false, error: stopResult.error }, { status: 400 })
        }

        await logoutOfUrnikNet()

        notifyTapEvent(userId, "tapOut")

        return NextResponse.json({ success: true, action: "stopped" })
    }

    const result = await startTimer({ type: "WORK" })

    if (result.error) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    notifyTapEvent(userId, "tapIn")

    return NextResponse.json({ success: true, action: "started" })
}

async function notifyTapEvent(userId: string, event: "tapIn" | "tapOut") {
    try {
        const [user, preferences] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, name: true, locale: true },
            }),
            prisma.notificationPreference.findUnique({
                where: { userId },
            }),
        ])

        if (!user?.email) {
            return
        }

        const isTapIn = event === "tapIn"
        const title = isTapIn ? "Clocked in" : "Clocked out"
        const body = isTapIn
            ? "Work tracking started via NFC tap"
            : "Work tracking stopped via NFC tap"
        const emailSubject = isTapIn ? "Time Manager - Clocked In" : "Time Manager - Clocked Out"
        const emailBody = isTapIn
            ? `<p>Hello ${user.name || ""},</p><p>You have been clocked in via NFC tap. Your work time tracking has started.</p>`
            : `<p>Hello ${user.name || ""},</p><p>You have been clocked out via NFC tap. Your work time tracking has stopped.</p>`

        const emailField = isTapIn ? "emailTapIn" : "emailTapOut"
        const pushField = isTapIn ? "pushTapIn" : "pushTapOut"

        const sendEmail_notification = !preferences || preferences[emailField] !== false
        const sendPush = !preferences || preferences[pushField] !== false

        if (sendEmail_notification) {
            sendEmail(user.email, emailSubject, emailBody)
        }

        if (sendPush) {
            sendPushNotification(userId, { title, body, url: "/tracker" })
        }
    } catch (error) {
        console.error("Failed to send tap notification:", error)
    }
}
