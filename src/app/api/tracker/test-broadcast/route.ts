import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { sseManager } from "@/lib/sse-manager"

export const dynamic = "force-dynamic"

export async function POST() {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 })
    }

    const userId = session.user.id
    console.log(`[Test Broadcast] Sending test event to user ${userId}`)

    sseManager.broadcast(userId, "test-event", {
        message: "This is a test broadcast",
        timestamp: new Date().toISOString(),
    })

    return Response.json({
        success: true,
        userId,
        connectionCount: sseManager.getConnectionCount(userId),
    })
}
