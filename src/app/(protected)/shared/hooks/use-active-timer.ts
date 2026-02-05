"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getActiveTimer } from "@/app/(protected)/shared/actions/timer-actions"
import { useTasksStore } from "@/app/(protected)/tasks/stores/tasks-store"
import { sharedKeys } from "../query-keys"

export function useActiveTimer() {
    const activeTimer = useTasksStore((state) => state.activeTimer)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearActiveTimer = useTasksStore((state) => state.clearActiveTimer)

    const { data: activeTimerData } = useQuery({
        queryKey: sharedKeys.activeTimer(),
        queryFn: getActiveTimer,
        gcTime: 0,
        refetchOnMount: true,
    })

    useEffect(() => {
        if (activeTimerData && activeTimerData.endTime === null) {
            if (
                !activeTimer ||
                activeTimer.taskId !== activeTimerData.taskId ||
                activeTimer.entryId !== activeTimerData.id ||
                activeTimer.startTime.getTime() !== activeTimerData.startTime.getTime()
            ) {
                clearActiveTimer()
                setActiveTimer(
                    activeTimerData.taskId,
                    activeTimerData.id,
                    activeTimerData.startTime
                )
            }
        } else if (!activeTimerData && activeTimer) {
            clearActiveTimer()
        }
    }, [activeTimerData, activeTimer, setActiveTimer, clearActiveTimer])

    return { activeTimerData, activeTimer }
}
