import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { getPusherServer } from "@/lib/pusher-server"

export async function POST(req: Request) {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 })
    }

    const pusher = getPusherServer()
    if (!pusher) {
        return new Response("Pusher not configured", { status: 500 })
    }

    const data = await req.text()
    const params = new URLSearchParams(data)
    const socketId = params.get("socket_id")
    const channel = params.get("channel_name")

    if (!socketId || !channel) {
        return new Response("Missing socket_id or channel_name", { status: 400 })
    }

    // Verify user can only subscribe to their own channel
    const expectedChannel = `private-user-${session.user.id}`
    if (channel !== expectedChannel) {
        return new Response("Unauthorized channel access", { status: 403 })
    }

    const authResponse = pusher.authorizeChannel(socketId, channel)

    return Response.json(authResponse)
}
