import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { hourKeys } from "../_constants/query-keys"

export function useHoursSSE() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectCountRef = useRef(0)

    useEffect(() => {
        const eventSource = new EventSource("/api/tracker/events")
        eventSourceRef.current = eventSource

        const handleEvent = () => {
            queryClient.invalidateQueries({ queryKey: hourKeys.all })
            router.refresh()
        }

        eventSource.onopen = () => {
            const reconnectCount = reconnectCountRef.current

            if (reconnectCount > 0) {
                handleEvent()
            }

            reconnectCountRef.current += 1
        }

        eventSource.addEventListener("timer-started", handleEvent)
        eventSource.addEventListener("timer-stopped", handleEvent)
        eventSource.addEventListener("time-entry-updated", handleEvent)
        eventSource.addEventListener("task-updated", handleEvent)

        eventSource.onerror = () => {}

        return () => {
            eventSource.removeEventListener("timer-started", handleEvent)
            eventSource.removeEventListener("timer-stopped", handleEvent)
            eventSource.removeEventListener("time-entry-updated", handleEvent)
            eventSource.removeEventListener("task-updated", handleEvent)
            eventSource.close()
        }
    }, [router, queryClient])
}
