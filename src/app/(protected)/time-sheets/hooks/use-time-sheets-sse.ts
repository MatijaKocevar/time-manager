import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function useTimeSheetsSSE() {
    const router = useRouter()
    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectCountRef = useRef(0)

    useEffect(() => {
        const eventSource = new EventSource("/api/tracker/events")
        eventSourceRef.current = eventSource

        const handleTimerStarted = () => {
            router.refresh()
        }

        const handleTimerStopped = () => {
            router.refresh()
        }

        eventSource.onopen = () => {
            const reconnectCount = reconnectCountRef.current

            if (reconnectCount > 0) {
                router.refresh()
            }

            reconnectCountRef.current += 1
        }

        eventSource.addEventListener("timer-started", handleTimerStarted)
        eventSource.addEventListener("timer-stopped", handleTimerStopped)

        eventSource.onerror = () => {}

        return () => {
            eventSource.removeEventListener("timer-started", handleTimerStarted)
            eventSource.removeEventListener("timer-stopped", handleTimerStopped)
            eventSource.close()
        }
    }, [router])
}
