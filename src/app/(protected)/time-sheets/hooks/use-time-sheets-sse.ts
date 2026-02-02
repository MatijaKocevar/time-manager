import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function useTimeSheetsSSE() {
    const router = useRouter()
    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectCountRef = useRef(0)

    useEffect(() => {
        const eventSource = new EventSource("/api/tracker/events")
        eventSourceRef.current = eventSource
        console.log("[Time Sheets SSE] EventSource created, connecting to /api/tracker/events")

        const handleTimerStarted = (e: MessageEvent) => {
            const timestamp = new Date().toISOString()
            console.log(`[Time Sheets SSE ${timestamp}] Received timer-started event`)
            try {
                const data = JSON.parse(e.data)
                console.log(`[Time Sheets SSE ${timestamp}] Event data:`, data)
            } catch (error) {
                console.error(
                    `[Time Sheets SSE ${timestamp}] Failed to parse timer-started data:`,
                    error
                )
            }
            router.refresh()
            console.log(`[Time Sheets SSE ${timestamp}] Router refreshed for timer-started`)
        }

        const handleTimerStopped = (e: MessageEvent) => {
            const timestamp = new Date().toISOString()
            console.log(`[Time Sheets SSE ${timestamp}] Received timer-stopped event`)
            try {
                const data = JSON.parse(e.data)
                console.log(`[Time Sheets SSE ${timestamp}] Event data:`, data)
            } catch (error) {
                console.error(
                    `[Time Sheets SSE ${timestamp}] Failed to parse timer-stopped data:`,
                    error
                )
            }
            router.refresh()
            console.log(`[Time Sheets SSE ${timestamp}] Router refreshed for timer-stopped`)
        }

        eventSource.onopen = () => {
            const timestamp = new Date().toISOString()
            const reconnectCount = reconnectCountRef.current
            console.log(
                `[Time Sheets SSE ${timestamp}] Connection opened (reconnect count: ${reconnectCount})`
            )

            if (reconnectCount > 0) {
                console.log(`[Time Sheets SSE ${timestamp}] Reconnected, refreshing router`)
                router.refresh()
            }

            reconnectCountRef.current += 1
        }

        eventSource.addEventListener("timer-started", handleTimerStarted)
        eventSource.addEventListener("timer-stopped", handleTimerStopped)

        eventSource.onerror = (event) => {
            const timestamp = new Date().toISOString()
            console.error(`[Time Sheets SSE ${timestamp}] Connection error:`, event)
            console.error(`[Time Sheets SSE ${timestamp}] ReadyState: ${eventSource.readyState}`)
        }

        return () => {
            const timestamp = new Date().toISOString()
            console.log(`[Time Sheets SSE ${timestamp}] Cleaning up, closing connection`)
            eventSource.removeEventListener("timer-started", handleTimerStarted)
            eventSource.removeEventListener("timer-stopped", handleTimerStopped)
            eventSource.close()
        }
    }, [router])
}
