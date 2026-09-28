import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import type { Channel } from "pusher-js"
import { getPusherClient } from "@/lib/pusher-client"
import { hourKeys } from "../_constants/query-keys"

export function useHoursPusher() {
    const router = useRouter()
    const queryClient = useQueryClient()
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

        const handleEvent = () => {
            queryClient.invalidateQueries({ queryKey: hourKeys.all })
            router.refresh()
        }

        channel.bind("timer-started", handleEvent)
        channel.bind("timer-stopped", handleEvent)
        channel.bind("time-entry-updated", handleEvent)
        channel.bind("task-updated", handleEvent)

        return () => {
            channel.unbind_all()
            pusher.unsubscribe(`private-user-${session.user.id}`)
        }
    }, [session?.user?.id, router, queryClient])
}
