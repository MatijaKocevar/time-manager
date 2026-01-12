import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { HourType } from "@/../../prisma/generated/client"
import { getActiveTrackingEntry } from "../actions/tracker-actions"
import { getElapsedSeconds } from "@/app/(protected)/tasks/utils/time-helpers"
import { useTasksStore } from "@/app/(protected)/tasks/stores/tasks-store"

interface UseTimerStateProps {
    initialActiveTimer: {
        id: string
        taskId: string
        userId: string
        startTime: Date
        endTime: Date | null
        duration: number | null
        createdAt: Date
        updatedAt: Date
        type: HourType
        task: {
            id: string
            title: string
            isSystemTask: boolean
        }
    } | null
}

export function useTimerState({ initialActiveTimer }: UseTimerStateProps) {
    const queryClient = useQueryClient()
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)

    const { data: activeTimerData } = useQuery({
        queryKey: ["tracker", "activeTimer"],
        queryFn: getActiveTrackingEntry,
        initialData: initialActiveTimer,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        staleTime: Infinity,
    })

    const elapsedSeconds = activeTimerData ? getElapsedSeconds(activeTimerData.startTime) : 0
    const isTimerRunning = Boolean(activeTimerData)

    useEffect(() => {
        if (activeTimerData) {
            setActiveTimer(activeTimerData.taskId, activeTimerData.id, activeTimerData.startTime)

            const interval = setInterval(() => {
                queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
            }, 1000)

            return () => clearInterval(interval)
        }
    }, [activeTimerData, setActiveTimer, queryClient])

    return {
        activeTimerData,
        elapsedSeconds,
        isTimerRunning,
    }
}
