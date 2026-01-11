import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { sseManager } from "@/lib/sse-manager"

export const dynamic = "force-dynamic"

export async function GET() {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 })
    }

    const userId = session.user.id
    const count = sseManager.getConnectionCount(userId)

    return Response.json({
        userId,
        connectionCount: count,
        timestamp: new Date().toISOString(),
    })
}
