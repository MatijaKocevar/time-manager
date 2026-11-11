import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { HourType } from "@/../../prisma/generated/client"
import { getActiveTimer } from "@/app/(protected)/shared/_actions/timer-actions"
import { getElapsedSeconds } from "@/app/(protected)/tasks/_utils/time-helpers"
import { useTasksStore } from "@/app/(protected)/tasks/_stores/tasks-store"
import { sharedKeys } from "@/app/(protected)/shared/_constants/query-keys"

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
    initialWorkStart?: Date | null
    initialWorkEnd?: Date | null
}

export function useTimerState({
    initialActiveTimer,
    initialWorkStart = null,
    initialWorkEnd = null,
}: UseTimerStateProps) {
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)

    const { data: activeTimerData } = useQuery({
        queryKey: sharedKeys.activeTimer(),
        queryFn: () => getActiveTimer(),
        initialData: initialActiveTimer,
        refetchOnWindowFocus: false,
    })

    const isTimerRunning = Boolean(activeTimerData)

    const runningStartMs = activeTimerData ? new Date(activeTimerData.startTime).getTime() : null
    const workStartMs = initialWorkStart ? new Date(initialWorkStart).getTime() : null
    const workEndMs = initialWorkEnd ? new Date(initialWorkEnd).getTime() : null
    const dayStartMs = workStartMs ?? runningStartMs

    const finishedSeconds =
        workStartMs !== null && workEndMs !== null
            ? Math.max(0, Math.floor((workEndMs - workStartMs) / 1000))
            : null

    const [elapsedSeconds, setElapsedSeconds] = useState(() =>
        dayStartMs !== null ? getElapsedSeconds(new Date(dayStartMs)) : 0
    )

    useEffect(() => {
        if (!activeTimerData) {
            return
        }

        const startTime = new Date(activeTimerData.startTime)

        setActiveTimer(activeTimerData.taskId, activeTimerData.id, startTime)
    }, [activeTimerData, setActiveTimer])

    useEffect(() => {
        if (dayStartMs === null || finishedSeconds !== null) {
            return
        }

        const startTime = new Date(dayStartMs)

        const updateElapsed = () => {
            setElapsedSeconds(getElapsedSeconds(startTime))
        }

        updateElapsed()

        const interval = setInterval(updateElapsed, 1000)

        return () => clearInterval(interval)
    }, [dayStartMs, finishedSeconds])

    return {
        activeTimerData,
        elapsedSeconds: finishedSeconds ?? elapsedSeconds,
        isTimerRunning,
        hasDayStarted: dayStartMs !== null,
    }
}
