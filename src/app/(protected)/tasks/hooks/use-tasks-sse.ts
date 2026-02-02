import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { taskKeys } from "../query-keys"
import { sharedKeys } from "@/app/(protected)/shared/query-keys"

export function useTasksSSE() {
    const queryClient = useQueryClient()
    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectCountRef = useRef(0)

    useEffect(() => {
        const eventSource = new EventSource("/api/tracker/events")
        eventSourceRef.current = eventSource
        console.log("[Tasks SSE] EventSource created, connecting to /api/tracker/events")

        const handleTimerStarted = (e: MessageEvent) => {
            const timestamp = new Date().toISOString()
            console.log(`[Tasks SSE ${timestamp}] Received timer-started event`)
            try {
                const data = JSON.parse(e.data)
                console.log(`[Tasks SSE ${timestamp}] Event data:`, data)
            } catch (error) {
                console.error(`[Tasks SSE ${timestamp}] Failed to parse timer-started data:`, error)
            }
            queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
            console.log(`[Tasks SSE ${timestamp}] Invalidated queries for timer-started`)
        }

        const handleTimerStopped = (e: MessageEvent) => {
            const timestamp = new Date().toISOString()
            console.log(`[Tasks SSE ${timestamp}] Received timer-stopped event`)
            try {
                const data = JSON.parse(e.data)
                console.log(`[Tasks SSE ${timestamp}] Event data:`, data)
            } catch (error) {
                console.error(`[Tasks SSE ${timestamp}] Failed to parse timer-stopped data:`, error)
            }
            queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
            console.log(`[Tasks SSE ${timestamp}] Invalidated queries for timer-stopped`)
        }

        eventSource.onopen = () => {
            const timestamp = new Date().toISOString()
            const reconnectCount = reconnectCountRef.current
            console.log(
                `[Tasks SSE ${timestamp}] Connection opened (reconnect count: ${reconnectCount})`
            )

            if (reconnectCount > 0) {
                console.log(`[Tasks SSE ${timestamp}] Reconnected, invalidating queries`)
                queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
                queryClient.invalidateQueries({ queryKey: taskKeys.all })
            }

            reconnectCountRef.current += 1
        }

        eventSource.addEventListener("timer-started", handleTimerStarted)
        eventSource.addEventListener("timer-stopped", handleTimerStopped)

        eventSource.onerror = (event) => {
            const timestamp = new Date().toISOString()
            console.error(`[Tasks SSE ${timestamp}] Connection error:`, event)
            console.error(`[Tasks SSE ${timestamp}] ReadyState: ${eventSource.readyState}`)
        }

        return () => {
            const timestamp = new Date().toISOString()
            console.log(`[Tasks SSE ${timestamp}] Cleaning up, closing connection`)
            eventSource.removeEventListener("timer-started", handleTimerStarted)
            eventSource.removeEventListener("timer-stopped", handleTimerStopped)
            eventSource.close()
        }
    }, [queryClient])
}
