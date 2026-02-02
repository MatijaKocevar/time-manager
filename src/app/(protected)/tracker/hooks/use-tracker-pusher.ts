import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import type { Channel } from "pusher-js"
import type { HourType } from "@/../../prisma/generated/client"
import { getPusherClient } from "@/lib/pusher-client"
import { useTrackerStore } from "../stores/tracker-store"

export function useTrackerPusher() {
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const pusherChannelRef = useRef<Channel | null>(null)
    const setSelectedType = useTrackerStore((state) => state.setSelectedType)
    const setSelectedTaskId = useTrackerStore((state) => state.setSelectedTaskId)

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

        channel.bind(
            "timer-started",
            (data: { type?: HourType; taskId?: string; entryId: string; startTime: Date }) => {
                if (data.type && data.taskId) {
                    setSelectedType(data.type)
                    setSelectedTaskId(data.taskId)
                }
                queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
                queryClient.invalidateQueries({ queryKey: ["tracker", "taskEntries"] })
            }
        )

        channel.bind("timer-stopped", () => {
            queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
            queryClient.invalidateQueries({ queryKey: ["tracker", "taskEntries"] })
        })

        channel.bind("time-entry-updated", () => {
            queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
            queryClient.invalidateQueries({ queryKey: ["tracker", "taskEntries"] })
        })

        return () => {
            channel.unbind_all()
            pusher.unsubscribe(`private-user-${session.user.id}`)
        }
    }, [session?.user?.id, queryClient, setSelectedType, setSelectedTaskId])
}
