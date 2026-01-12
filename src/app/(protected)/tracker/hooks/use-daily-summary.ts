"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getTodayTimeSummary } from "../actions/tracker-actions"
import { useEffect, useState } from "react"

export function useDailySummary() {
    const queryClient = useQueryClient()
    const [, setTick] = useState(0)

    const { data, isLoading, error } = useQuery({
        queryKey: ["tracker", "dailySummary"],
        queryFn: getTodayTimeSummary,
        refetchOnWindowFocus: false,
        staleTime: 60000,
    })

    useEffect(() => {
        const handleTimerChange = () => {
            queryClient.invalidateQueries({ queryKey: ["tracker", "dailySummary"] })
        }

        queryClient.getQueryCache().subscribe((event) => {
            if (
                event?.query.queryKey[0] === "tracker" &&
                event?.query.queryKey[1] === "activeTimer"
            ) {
                handleTimerChange()
            }
        })
    }, [queryClient])

    useEffect(() => {
        if (data?.activeTimer) {
            const interval = setInterval(() => {
                setTick((prev) => prev + 1)
            }, 1000)

            return () => clearInterval(interval)
        }
    }, [data?.activeTimer])

    const getAdjustedTotal = (type: "WORK" | "BREAK" | "PRIVATE") => {
        if (!data) return 0

        let total = data.totals[type]

        if (data.activeTimer && data.activeTimer.type === type) {
            const elapsed =
                (new Date().getTime() - new Date(data.activeTimer.startTime).getTime()) / 1000
            total += elapsed / 3600
        }

        return total
    }

    return {
        totals: {
            WORK: getAdjustedTotal("WORK"),
            BREAK: getAdjustedTotal("BREAK"),
            PRIVATE: getAdjustedTotal("PRIVATE"),
        },
        isLoading,
        error,
    }
}
