import { useEffect, useState } from "react"
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
    const [elapsedSeconds, setElapsedSeconds] = useState(0)

    const { data: activeTimerData } = useQuery({
        queryKey: ["tracker", "activeTimer"],
        queryFn: getActiveTrackingEntry,
        initialData: initialActiveTimer,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        staleTime: Infinity,
    })

    const isTimerRunning = Boolean(activeTimerData)

    useEffect(() => {
        if (activeTimerData) {
            const startTime = new Date(activeTimerData.startTime)
            setActiveTimer(activeTimerData.taskId, activeTimerData.id, startTime)

            const updateElapsed = () => {
                setElapsedSeconds(getElapsedSeconds(startTime))
            }

            updateElapsed()

            const interval = setInterval(updateElapsed, 1000)

            return () => clearInterval(interval)
        } else {
            setElapsedSeconds(0)
        }
    }, [activeTimerData, queryClient])

    return {
        activeTimerData,
        elapsedSeconds,
        isTimerRunning,
    }
}
