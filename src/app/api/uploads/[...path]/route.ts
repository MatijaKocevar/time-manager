import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import fs from "fs/promises"
import path from "path"

function getBasePath(): string {
    return process.env.UPLOAD_BASE_PATH ?? path.join(process.cwd(), "public", "uploads")
}

const MIME_BY_EXT: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const session = await getServerSession(authConfig)
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { path: segments } = await params
    const base = path.resolve(getBasePath())
    const requested = path.resolve(path.join(base, ...segments))

    if (!requested.startsWith(base + path.sep) && requested !== base) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    try {
        const buffer = await fs.readFile(requested)
        const ext = path.extname(requested).toLowerCase()
        const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream"

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "private, max-age=31536000, immutable",
            },
        })
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
}
