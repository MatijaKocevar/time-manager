import PusherClient from "pusher-js"

let pusherClient: PusherClient | null = null

export function getPusherClient() {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
        console.log("[Pusher Client] Not configured")
        return null
    }

    if (!pusherClient) {
        console.log("[Pusher Client] Creating new Pusher client instance")
        pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            authEndpoint: "/api/pusher/auth",
        })
    }

    return pusherClient
}
