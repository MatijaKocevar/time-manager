"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { listKeys } from "@/app/(protected)/tasks/_constants/query-keys"

export function useListUpdates() {
    const queryClient = useQueryClient()

    useEffect(() => {
        const eventSource = new EventSource("/api/tracker/events")

        const handleListUpdated = () => {
            queryClient.invalidateQueries({ queryKey: listKeys.all })
        }

        eventSource.addEventListener("list-updated", handleListUpdated)
        eventSource.onerror = () => {}

        return () => {
            eventSource.removeEventListener("list-updated", handleListUpdated)
            eventSource.close()
        }
    }, [queryClient])
}
