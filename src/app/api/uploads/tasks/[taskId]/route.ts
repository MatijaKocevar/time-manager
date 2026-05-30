import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStorageAdapter } from "@/lib/storage/factory"
import { randomUUID } from "crypto"
import path from "path"

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"])
const MAX_BYTES = (Number(process.env.UPLOAD_MAX_SIZE_MB) || 10) * 1024 * 1024

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    if (process.env.VERCEL === "1") {
        return NextResponse.json(
            { error: "Image uploads are not available in the demo" },
            { status: 503 }
        )
    }

    const session = await getServerSession(authConfig)
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task || task.userId !== session.user.id) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    const ext = path.extname(file.name).toLowerCase() || ".jpg"
    const filename = `${randomUUID()}${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const adapter = getStorageAdapter()
    const url = await adapter.upload(buffer, filename, `tasks/${taskId}`)

    return NextResponse.json({ url })
}
