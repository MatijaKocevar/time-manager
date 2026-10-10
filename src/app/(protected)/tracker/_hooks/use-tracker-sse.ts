import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useTrackerStore } from "../_stores/tracker-store"
import { sharedKeys } from "@/app/(protected)/shared/_constants/query-keys"
import { trackerKeys } from "../_constants/query-keys"

export function useTrackerSSE() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectCountRef = useRef(0)
    const setSelectedType = useTrackerStore((state) => state.setSelectedType)
    const setSelectedTaskId = useTrackerStore((state) => state.setSelectedTaskId)

    useEffect(() => {
        const eventSource = new EventSource("/api/tracker/events")
        eventSourceRef.current = eventSource

        const handleTimerStarted = (e: MessageEvent) => {
            try {
                const data = JSON.parse(e.data)
                if (data.type && data.taskId) {
                    setSelectedType(data.type)
                    setSelectedTaskId(data.taskId)
                }
            } catch {}
            queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: trackerKeys.taskEntryCounts() })
        }

        const handleTimerStopped = () => {
            queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: trackerKeys.taskEntryCounts() })
        }

        const handleTimeEntryUpdated = () => {
            queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: trackerKeys.taskEntryCounts() })
        }

        const handleTaskUpdated = () => {
            queryClient.invalidateQueries({ queryKey: trackerKeys.taskEntryCounts() })
            router.refresh()
        }

        eventSource.onopen = () => {
            const reconnectCount = reconnectCountRef.current

            if (reconnectCount > 0) {
                queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
                queryClient.invalidateQueries({ queryKey: trackerKeys.taskEntryCounts() })
                router.refresh()
            }

            reconnectCountRef.current += 1
        }

        eventSource.addEventListener("timer-started", handleTimerStarted)
        eventSource.addEventListener("timer-stopped", handleTimerStopped)
        eventSource.addEventListener("time-entry-updated", handleTimeEntryUpdated)
        eventSource.addEventListener("task-updated", handleTaskUpdated)

        eventSource.onerror = () => {}

        return () => {
            eventSource.removeEventListener("timer-started", handleTimerStarted)
            eventSource.removeEventListener("timer-stopped", handleTimerStopped)
            eventSource.removeEventListener("time-entry-updated", handleTimeEntryUpdated)
            eventSource.removeEventListener("task-updated", handleTaskUpdated)
            eventSource.close()
        }
    }, [router, queryClient, setSelectedType, setSelectedTaskId])
}
