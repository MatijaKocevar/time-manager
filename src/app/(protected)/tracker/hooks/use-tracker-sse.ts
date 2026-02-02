import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTrackerStore } from "../stores/tracker-store"

export function useTrackerSSE() {
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
            queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
            queryClient.invalidateQueries({ queryKey: ["tracker", "taskEntries"] })
        }

        const handleTimerStopped = () => {
            queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
            queryClient.invalidateQueries({ queryKey: ["tracker", "taskEntries"] })
        }

        const handleTimeEntryUpdated = () => {
            queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
            queryClient.invalidateQueries({ queryKey: ["tracker", "taskEntries"] })
        }

        eventSource.onopen = () => {
            const reconnectCount = reconnectCountRef.current

            if (reconnectCount > 0) {
                queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
                queryClient.invalidateQueries({ queryKey: ["tracker", "taskEntries"] })
            }

            reconnectCountRef.current += 1
        }

        eventSource.addEventListener("timer-started", handleTimerStarted)
        eventSource.addEventListener("timer-stopped", handleTimerStopped)
        eventSource.addEventListener("time-entry-updated", handleTimeEntryUpdated)

        eventSource.onerror = () => {}

        return () => {
            eventSource.removeEventListener("timer-started", handleTimerStarted)
            eventSource.removeEventListener("timer-stopped", handleTimerStopped)
            eventSource.removeEventListener("time-entry-updated", handleTimeEntryUpdated)
            eventSource.close()
        }
    }, [queryClient, setSelectedType, setSelectedTaskId])
}
