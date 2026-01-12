import Pusher from "pusher"

const globalForPusher = globalThis as unknown as {
    pusher: Pusher | undefined
}

export function getPusherServer() {
    if (
        !process.env.PUSHER_APP_ID ||
        !process.env.NEXT_PUBLIC_PUSHER_KEY ||
        !process.env.PUSHER_SECRET ||
        !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ) {
        console.log("[Pusher] Not configured - skipping initialization")
        return null
    }

    if (!globalForPusher.pusher) {
        console.log("[Pusher] Creating new Pusher server instance")
        globalForPusher.pusher = new Pusher({
            appId: process.env.PUSHER_APP_ID,
            key: process.env.NEXT_PUBLIC_PUSHER_KEY,
            secret: process.env.PUSHER_SECRET,
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            useTLS: true,
        })
    }

    return globalForPusher.pusher
}
