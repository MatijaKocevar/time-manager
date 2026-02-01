"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getActiveTimer } from "@/app/(protected)/tasks/actions/task-time-actions"
import { useTasksStore } from "@/app/(protected)/tasks/stores/tasks-store"
import { sharedKeys } from "../query-keys"

export function useActiveTimer() {
    const activeTimers = useTasksStore((state) => state.activeTimers)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearActiveTimer = useTasksStore((state) => state.clearActiveTimer)
    const clearAllActiveTimers = useTasksStore((state) => state.clearAllActiveTimers)

    const { data: activeTimerData } = useQuery({
        queryKey: sharedKeys.activeTimer(),
        queryFn: getActiveTimer,
        gcTime: 0,
        refetchOnMount: true,
    })

    useEffect(() => {
        if (activeTimerData && activeTimerData.endTime === null) {
            const currentTimer = activeTimers.get(activeTimerData.taskId)

            if (
                !currentTimer ||
                currentTimer.entryId !== activeTimerData.id ||
                currentTimer.startTime.getTime() !== activeTimerData.startTime.getTime()
            ) {
                clearAllActiveTimers()
                setActiveTimer(
                    activeTimerData.taskId,
                    activeTimerData.id,
                    activeTimerData.startTime
                )
            }
        } else if (!activeTimerData && activeTimers.size > 0) {
            Array.from(activeTimers.keys()).forEach((taskId) => {
                clearActiveTimer(taskId)
            })
        }
    }, [activeTimerData, activeTimers, setActiveTimer, clearActiveTimer, clearAllActiveTimers])

    return { activeTimerData, activeTimers }
}
