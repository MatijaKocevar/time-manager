import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { getDayEntries } from "../_actions/time-sheet-actions"
import { timeSheetKeys } from "../query-keys"
import type { HourType } from "@/../../prisma/generated/client"

interface UseDayEntriesParams {
    date: string | null
    type?: HourType | null
    enabled?: boolean
}

export function useDayEntries({ date, type, enabled = true }: UseDayEntriesParams) {
    const queryClient = useQueryClient()

    const query = useQuery({
        queryKey: timeSheetKeys.dayEntry({
            date: date ?? "",
            ...(type && { type }),
        }),
        queryFn: () => {
            if (!date) return { success: false, data: [] }
            return getDayEntries({ date, ...(type && { type }) })
        },
        enabled: enabled && !!date,
    })

    useEffect(() => {
        if (!enabled || !date) return

        const eventSource = new EventSource("/api/tracker/events")

        const handleTimerEvent = () => {
            queryClient.invalidateQueries({
                queryKey: timeSheetKeys.dayEntry({
                    date: date ?? "",
                    ...(type && { type }),
                }),
            })
        }

        eventSource.addEventListener("timer-started", handleTimerEvent)
        eventSource.addEventListener("timer-stopped", handleTimerEvent)
        eventSource.addEventListener("time-entry-updated", handleTimerEvent)

        eventSource.onerror = () => {}

        return () => {
            eventSource.removeEventListener("timer-started", handleTimerEvent)
            eventSource.removeEventListener("timer-stopped", handleTimerEvent)
            eventSource.removeEventListener("time-entry-updated", handleTimerEvent)
            eventSource.close()
        }
    }, [date, type, enabled, queryClient])

    return query
}
