import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export function useTimeSheetsSSE() {
    const router = useRouter()
    const { data: session } = useSession()
    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectCountRef = useRef(0)

    useEffect(() => {
        const eventSource = new EventSource("/api/tracker/events")
        eventSourceRef.current = eventSource

        const handleTimerEvent = async () => {
            if (session?.user?.id) {
                await fetch("/api/invalidate-time-sheets", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: session.user.id }),
                })
            }
            router.refresh()
        }

        eventSource.onopen = () => {
            const reconnectCount = reconnectCountRef.current

            if (reconnectCount > 0) {
                handleTimerEvent()
            }

            reconnectCountRef.current += 1
        }

        eventSource.addEventListener("timer-started", handleTimerEvent)
        eventSource.addEventListener("timer-stopped", handleTimerEvent)

        eventSource.onerror = () => {}

        return () => {
            eventSource.removeEventListener("timer-started", handleTimerEvent)
            eventSource.removeEventListener("timer-stopped", handleTimerEvent)
            eventSource.close()
        }
    }, [router, session?.user?.id])
}
