import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { HourType } from "@/../../prisma/generated/client"
import { getActiveTimer } from "@/app/(protected)/shared/_actions/timer-actions"
import { getElapsedSeconds } from "@/app/(protected)/tasks/_utils/time-helpers"
import { useTasksStore } from "@/app/(protected)/tasks/_stores/tasks-store"
import { sharedKeys } from "@/app/(protected)/shared/query-keys"

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
        queryKey: sharedKeys.activeTimer(),
        queryFn: () => getActiveTimer(),
        initialData: initialActiveTimer,
        refetchOnWindowFocus: false,
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
    }, [activeTimerData, setActiveTimer])

    return {
        activeTimerData,
        elapsedSeconds,
        isTimerRunning,
    }
}
