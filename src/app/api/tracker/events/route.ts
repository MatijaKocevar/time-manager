import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { sseManager } from "@/lib/sse-manager"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 })
    }

    const userId = session.user.id
    let connectionId: number | null = null

    const stream = new ReadableStream({
        start(controller) {
            connectionId = sseManager.addConnection(userId, controller)

            const encoder = new TextEncoder()
            controller.enqueue(encoder.encode(`: connected\n\n`))

            const keepAliveInterval = setInterval(() => {
                if (connectionId === null) {
                    clearInterval(keepAliveInterval)
                    return
                }

                try {
                    controller.enqueue(encoder.encode(`: keepalive\n\n`))
                } catch (_error) {
                    console.log(`[SSE Route] Keep-alive failed for connection ${connectionId}`)
                    clearInterval(keepAliveInterval)
                }
            }, 30000)

            return () => {
                clearInterval(keepAliveInterval)
            }
        },
        cancel() {
            if (connectionId !== null) {
                sseManager.removeConnection(userId, connectionId)
                connectionId = null
            }
        },
    })

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    })
}
