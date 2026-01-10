import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
    const { locale } = await request.json()

    console.log("[SET-LOCALE API] Received locale change request:", locale)

    if (!locale || !["en", "sl"].includes(locale)) {
        console.log("[SET-LOCALE API] Invalid locale:", locale)
        return NextResponse.json({ error: "Invalid locale" }, { status: 400 })
    }

    const cookieStore = await cookies()
    cookieStore.set("NEXT_LOCALE", locale, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
    })
    console.log("[SET-LOCALE API] Cookie set to:", locale)

    const session = await getServerSession(authConfig)
    if (session?.user?.id) {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { locale },
        })
        console.log(
            "[SET-LOCALE API] Database updated for user:",
            session.user.id,
            "locale:",
            locale
        )
    } else {
        console.log("[SET-LOCALE API] No session found, database not updated")
    }

    return NextResponse.json({ success: true })
}
