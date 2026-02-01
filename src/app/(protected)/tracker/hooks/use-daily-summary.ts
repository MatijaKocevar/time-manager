"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getTodayTimeSummary } from "../actions/tracker-actions"
import { useEffect, useState } from "react"
import type { HourType } from "@/../../prisma/generated/client"

interface DailySummaryData {
    totals: Record<"WORK" | "BREAK" | "PRIVATE", number>
    activeTimer: {
        id: string
        startTime: Date
        type: HourType
    } | null
}

export function useDailySummary(initialData: DailySummaryData) {
    const queryClient = useQueryClient()
    const [, setTick] = useState(0)

    const { data, isLoading, error } = useQuery({
        queryKey: ["tracker", "dailySummary"],
        queryFn: () => getTodayTimeSummary(),
        initialData,
        refetchOnWindowFocus: false,
        staleTime: 60000,
    })

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
