import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import type { Channel } from "pusher-js"
import { getPusherClient } from "@/lib/pusher-client"
import { taskKeys } from "../_constants/query-keys"
import { sharedKeys } from "@/app/(protected)/shared/_constants/query-keys"

export function useTasksPusher() {
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

        channel.bind("timer-started", () => {
            queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
        })

        channel.bind("timer-stopped", () => {
            queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
        })

        return () => {
            channel.unbind_all()
            pusher.unsubscribe(`private-user-${session.user.id}`)
        }
    }, [session?.user?.id, queryClient])
}
