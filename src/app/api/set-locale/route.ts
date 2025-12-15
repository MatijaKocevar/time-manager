import { NextResponse } from "next/server"
import { cookies } from "next/headers"

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

    return NextResponse.json({ success: true })
}
