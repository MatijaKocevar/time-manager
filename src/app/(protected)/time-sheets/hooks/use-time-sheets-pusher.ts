import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import type { Channel } from "pusher-js"
import { getPusherClient } from "@/lib/pusher-client"

export function useTimeSheetsPusher() {
    const router = useRouter()
    const { data: session } = useSession()
    const pusherChannelRef = useRef<Channel | null>(null)

    useEffect(() => {
        if (!session?.user?.id) return

        const isVercel = process.env.NEXT_PUBLIC_VERCEL_ENV !== undefined
        if (!isVercel) {
            return
        }
        const pusher = getPusherClient()
        if (!pusher) {
            return
        }

        const channel = pusher.subscribe(`private-user-${session.user.id}`)
        pusherChannelRef.current = channel

        const handleTimerEvent = async () => {
            await fetch("/api/invalidate-time-sheets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: session.user.id }),
            })
            router.refresh()
        }

        channel.bind("timer-started", handleTimerEvent)
        channel.bind("timer-stopped", handleTimerEvent)

        return () => {
            channel.unbind_all()
            pusher.unsubscribe(`private-user-${session.user.id}`)
        }
    }, [session?.user?.id, router])
}
