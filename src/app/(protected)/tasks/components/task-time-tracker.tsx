"use client"

import { Play, Square } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { startTimer, stopTimer } from "../actions/task-time-actions"
import { useTasksStore } from "../stores/tasks-store"
import { taskKeys } from "../query-keys"
import { formatDuration } from "../utils/time-helpers"
import type { TaskTreeNode } from "../schemas"

interface TaskTimeTrackerProps {
    task: TaskTreeNode
}

export function TaskTimeTracker({ task }: TaskTimeTrackerProps) {
    const queryClient = useQueryClient()
    const t = useTranslations("tasks.actions")
    const activeTimers = useTasksStore((state) => state.activeTimers)
    const elapsedTimes = useTasksStore((state) => state.elapsedTimes)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearActiveTimer = useTasksStore((state) => state.clearActiveTimer)
    const openTimeEntriesDialog = useTasksStore((state) => state.openTimeEntriesDialog)
    const setTaskOperationLoading = useTasksStore((state) => state.setTaskOperationLoading)
    const isLoading = useTasksStore(
        (state) => state.taskOperations.get(task.id)?.isLoading ?? false
    )

    const activeTimer = activeTimers.get(task.id)
    const elapsedSeconds = elapsedTimes.get(task.id) ?? 0
    const isRunning = !!activeTimer

    const handleStart = async () => {
        setTaskOperationLoading(task.id, true)
        try {
            const result = await startTimer({ taskId: task.id })

            if (result.success && result.entryId) {
                const clearAllActiveTimers = useTasksStore.getState().clearAllActiveTimers
                clearAllActiveTimers()
                setActiveTimer(task.id, result.entryId, new Date())
                await queryClient.invalidateQueries({ queryKey: taskKeys.activeTimer() })
            } else {
                console.error("Failed to start timer:", result.error)
            }
        } catch (error) {
            console.error("Failed to start timer:", error)
        } finally {
            setTaskOperationLoading(task.id, false)
        }
    }

    const handleStop = async () => {
        if (!activeTimer) return

        setTaskOperationLoading(task.id, true)
        try {
            const result = await stopTimer({ id: activeTimer.entryId })

            if (result.success) {
                clearActiveTimer(task.id)
                await queryClient.invalidateQueries({ queryKey: taskKeys.all })
            } else {
                console.error("Failed to stop timer:", result.error)
            }
        } catch (error) {
            console.error("Failed to stop timer:", error)
        } finally {
            setTaskOperationLoading(task.id, false)
        }
    }

    const handleClick = () => {
        if (!isRunning) {
            openTimeEntriesDialog(task.id)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                variant={isRunning ? "destructive" : "default"}
                size="sm"
                onClick={isRunning ? handleStop : handleStart}
                disabled={isLoading}
                className="h-8 w-8 p-0"
            >
                {isRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span className="sr-only">{isRunning ? t("stopTimer") : t("startTimer")}</span>
            </Button>
            <button
                onClick={handleClick}
                className="text-sm font-mono hover:underline cursor-pointer"
                disabled={isRunning}
            >
                {isRunning ? formatDuration(elapsedSeconds) : formatDuration(task.totalTime ?? 0)}
            </button>
        </div>
    )
}
