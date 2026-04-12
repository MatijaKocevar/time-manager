import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authConfig)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { userId } = await request.json()

        if (userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        revalidatePath("/time-sheets")

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error invalidating time sheets cache:", error)
        return NextResponse.json({ error: "Failed to invalidate cache" }, { status: 500 })
    }
}
