import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
    const { locale } = await request.json()

    if (!locale || !["en", "sl"].includes(locale)) {
        return NextResponse.json({ error: "Invalid locale" }, { status: 400 })
    }

    const cookieStore = await cookies()
    cookieStore.set("NEXT_LOCALE", locale, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
    })

    const session = await getServerSession(authConfig)
    if (session?.user?.id) {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { locale },
        })
    }

    return NextResponse.json({ success: true })
}
