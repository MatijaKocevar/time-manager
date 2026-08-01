import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
    getActiveTimer,
    startTimer,
    stopTimer,
} from "@/app/(protected)/shared/_actions/timer-actions"
import {
    clockInToUrnik,
    clockOutAndStopTimer,
} from "@/app/(protected)/urnik-net-overview/_actions/clock-actions"
import { sendPushNotification } from "@/features/notifications/actions/notification-actions"
import { sendEmail } from "@/features/notifications/lib/email"

export async function GET(request: NextRequest) {
    const session = await getServerSession(authConfig)
    const token = request.nextUrl.searchParams.get("token")
    const proto = "https"
    const host =
        request.headers.get("x-forwarded-host") || request.headers.get("host") || "time.manager"
    const base = `${proto}://${host}`
    const tapUrl = `/api/tap-in${token ? `?token=${token}` : ""}`

    if (!session?.user) {
        const loginUrl = new URL("/login", base)
        loginUrl.searchParams.set("callbackUrl", tapUrl)
        return NextResponse.redirect(loginUrl)
    }

    const userId = session.user.id

    if (isDuplicateTap(userId)) {
        return homeRedirect(base, {})
    }

    const activeTimer = await getActiveTimer()

    if (activeTimer) {
        const skipUrnik = process.env.DEBUG_SKIP_URNIK_LOGIN === "true"

        if (skipUrnik) {
            const stopResult = await stopTimer({ id: activeTimer.id })

            if (stopResult.error) {
                return homeRedirect(base, { tapError: stopResult.error })
            }
        } else {
            const clockOutResult = await clockOutAndStopTimer()

            if (clockOutResult.error) {
                return homeRedirect(base, { tapError: clockOutResult.error })
            }
        }

        notifyTapEvent(userId, "tapOut")

        return homeRedirect(base, { tapStopped: "1" })
    }

    const hourType = token === "home" ? "WORK_FROM_HOME" : "WORK"
    const result = await startTimer({ type: hourType })

    if (result.error) {
        return homeRedirect(base, { tapError: result.error })
    }

    notifyTapEvent(userId, "tapIn")

    if (result.shouldShowArrivalDialog && process.env.DEBUG_SKIP_URNIK_LOGIN !== "true") {
        clockInToUrnik(token === "home")
    }

    return homeRedirect(base, { tapStarted: "1" })
}

const recentTaps = new Map<string, number>()

function isDuplicateTap(userId: string): boolean {
    const lastTap = recentTaps.get(userId)
    if (lastTap && Date.now() - lastTap < 3000) {
        return true
    }
    recentTaps.set(userId, Date.now())
    return false
}

function homeRedirect(baseUrl: string, params: Record<string, string>): NextResponse {
    const url = new URL("/", baseUrl)
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value)
    }
    return NextResponse.redirect(url)
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
