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
        return null
    }

    if (!globalForPusher.pusher) {
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
