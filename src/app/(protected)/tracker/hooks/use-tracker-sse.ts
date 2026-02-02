import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTrackerStore } from "../stores/tracker-store"
import { sharedKeys } from "@/app/(protected)/shared/query-keys"

export function useTrackerSSE() {
    const queryClient = useQueryClient()
    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectCountRef = useRef(0)
    const setSelectedType = useTrackerStore((state) => state.setSelectedType)
    const setSelectedTaskId = useTrackerStore((state) => state.setSelectedTaskId)

    useEffect(() => {
        const eventSource = new EventSource("/api/tracker/events")
        eventSourceRef.current = eventSource
        console.log("[Tracker SSE] EventSource created, connecting to /api/tracker/events")

        const handleTimerStarted = (e: MessageEvent) => {
            const timestamp = new Date().toISOString()
            console.log(`[Tracker SSE ${timestamp}] Received timer-started event`)
            try {
                const data = JSON.parse(e.data)
                console.log(`[Tracker SSE ${timestamp}] Event data:`, data)
                if (data.type && data.taskId) {
                    setSelectedType(data.type)
                    setSelectedTaskId(data.taskId)
                    console.log(
                        `[Tracker SSE ${timestamp}] Updated tracker state: type=${data.type}, taskId=${data.taskId}`
                    )
                }
            } catch (error) {
                console.error(
                    `[Tracker SSE ${timestamp}] Failed to parse timer-started data:`,
                    error
                )
            }
            queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: ["tracker", "taskEntries"] })
            console.log(`[Tracker SSE ${timestamp}] Invalidated queries for timer-started`)
        }

        const handleTimerStopped = () => {
            const timestamp = new Date().toISOString()
            console.log(`[Tracker SSE ${timestamp}] Received timer-stopped event`)
            queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: ["tracker", "taskEntries"] })
            console.log(`[Tracker SSE ${timestamp}] Invalidated queries for timer-stopped`)
        }

        const handleTimeEntryUpdated = () => {
            const timestamp = new Date().toISOString()
            console.log(`[Tracker SSE ${timestamp}] Received time-entry-updated event`)
            queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: ["tracker", "taskEntries"] })
            console.log(`[Tracker SSE ${timestamp}] Invalidated queries for time-entry-updated`)
        }

        eventSource.onopen = () => {
            const timestamp = new Date().toISOString()
            const reconnectCount = reconnectCountRef.current
            console.log(
                `[Tracker SSE ${timestamp}] Connection opened (reconnect count: ${reconnectCount})`
            )

            if (reconnectCount > 0) {
                console.log(`[Tracker SSE ${timestamp}] Reconnected, invalidating queries`)
                queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
                queryClient.invalidateQueries({ queryKey: ["tracker", "taskEntries"] })
            }

            reconnectCountRef.current += 1
        }

        eventSource.addEventListener("timer-started", handleTimerStarted)
        eventSource.addEventListener("timer-stopped", handleTimerStopped)
        eventSource.addEventListener("time-entry-updated", handleTimeEntryUpdated)

        eventSource.onerror = (event) => {
            const timestamp = new Date().toISOString()
            console.error(`[Tracker SSE ${timestamp}] Connection error:`, event)
            console.error(`[Tracker SSE ${timestamp}] ReadyState: ${eventSource.readyState}`)
        }

        return () => {
            const timestamp = new Date().toISOString()
            console.log(`[Tracker SSE ${timestamp}] Cleaning up, closing connection`)
            eventSource.removeEventListener("timer-started", handleTimerStarted)
            eventSource.removeEventListener("timer-stopped", handleTimerStopped)
            eventSource.removeEventListener("time-entry-updated", handleTimeEntryUpdated)
            eventSource.close()
        }
    }, [queryClient, setSelectedType, setSelectedTaskId])
}
