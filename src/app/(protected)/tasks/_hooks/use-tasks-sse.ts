import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { taskKeys, listKeys } from "../_constants/query-keys"
import { sharedKeys } from "@/app/(protected)/shared/_constants/query-keys"

export function useTasksSSE() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectCountRef = useRef(0)

    useEffect(() => {
        const eventSource = new EventSource("/api/tracker/events")
        eventSourceRef.current = eventSource

        const handleTimerStarted = () => {
            queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
        }

        const handleTimerStopped = () => {
            queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
        }

        const handleTaskUpdated = () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
            queryClient.invalidateQueries({ queryKey: listKeys.all })
            router.refresh()
        }

        eventSource.onopen = () => {
            const reconnectCount = reconnectCountRef.current

            if (reconnectCount > 0) {
                queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
                queryClient.invalidateQueries({ queryKey: taskKeys.all })
                router.refresh()
            }

            reconnectCountRef.current += 1
        }

        eventSource.addEventListener("timer-started", handleTimerStarted)
        eventSource.addEventListener("timer-stopped", handleTimerStopped)
        eventSource.addEventListener("time-entry-updated", handleTimerStopped)
        eventSource.addEventListener("task-updated", handleTaskUpdated)
        eventSource.addEventListener("list-updated", handleTaskUpdated)

        eventSource.onerror = () => {}

        return () => {
            eventSource.removeEventListener("timer-started", handleTimerStarted)
            eventSource.removeEventListener("timer-stopped", handleTimerStopped)
            eventSource.removeEventListener("time-entry-updated", handleTimerStopped)
            eventSource.removeEventListener("task-updated", handleTaskUpdated)
            eventSource.removeEventListener("list-updated", handleTaskUpdated)
            eventSource.close()
        }
    }, [router, queryClient])
}
