"use client"

import { useState } from "react"
import { Play, Square } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ArrivalDialog } from "@/components/arrival-dialog"
import { useQueryClient } from "@tanstack/react-query"
import { startTimer, stopTimer } from "@/app/(protected)/shared/_actions/timer-actions"
import { useTasksStore } from "../_stores/tasks-store"
import { useTaskDialogStore } from "../_stores/task-dialog-stores"
import { taskKeys } from "../_constants/query-keys"
import { formatDuration } from "../_utils/time-helpers"
import type { TaskTreeNode } from "../_schemas"

interface TaskTimeTrackerProps {
    task: TaskTreeNode
}

export function TaskTimeTracker({ task }: TaskTimeTrackerProps) {
    const [showArrivalDialog, setShowArrivalDialog] = useState(false)
    const [hasApprovedWFH, setHasApprovedWFH] = useState<boolean>(false)
    const [wfhLocation, setWfhLocation] = useState<string | null>(null)
    const queryClient = useQueryClient()
    const t = useTranslations("tasks.actions")
    const tClock = useTranslations("clock")
    const tCommon = useTranslations("common")
    const activeTimer = useTasksStore((state) => state.activeTimer)
    const elapsedSeconds = useTasksStore((state) => state.elapsedSeconds)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearActiveTimer = useTasksStore((state) => state.clearActiveTimer)
    const openTimeEntriesDialog = useTaskDialogStore((state) => state.openTimeEntriesDialog)
    const setTaskOperationLoading = useTasksStore((state) => state.setTaskOperationLoading)
    const isLoading = useTasksStore(
        (state) => state.taskOperations.get(task.id)?.isLoading ?? false
    )

    const isRunning = activeTimer?.taskId === task.id

    const handleStart = async () => {
        setTaskOperationLoading(task.id, true)
        try {
            const result = await startTimer({ taskId: task.id })

            if (result.success && result.entryId) {
                const clearActiveTimer = useTasksStore.getState().clearActiveTimer
                clearActiveTimer()
                setActiveTimer(task.id, result.entryId, new Date())
                await queryClient.invalidateQueries({ queryKey: taskKeys.activeTimer() })

                if (result.shouldShowArrivalDialog) {
                    setHasApprovedWFH(result.hasApprovedWFH ?? false)
                    setWfhLocation(result.wfhLocation ?? null)
                    setShowArrivalDialog(true)
                }
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
                clearActiveTimer()
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
        openTimeEntriesDialog(task.id)
    }

    const arrivalDialogTranslations = {
        title: tClock("arrivalDialog.title"),
        message: tClock("arrivalDialog.message"),
        yesButton: tClock("arrivalDialog.yesButton"),
        noButton: tClock("arrivalDialog.noButton"),
        successMessage: tClock("arrivalDialog.successMessage"),
        errorTitle: tCommon("error.title"),
        workFromHomeCheckbox: tClock("arrivalDialog.workFromHomeCheckbox"),
        workFromHomeApproved: tClock("arrivalDialog.workFromHomeApproved"),
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <Button
                    variant={isRunning ? "destructive" : "default"}
                    size="sm"
                    onClick={isRunning ? handleStop : handleStart}
                    disabled={isLoading}
                    className="tasks-time-tracker h-8 w-8 p-0"
                    aria-label={isRunning ? t("stopTimer") : t("startTimer")}
                >
                    {isRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <button
                    onClick={handleClick}
                    className="tasks-time-entries-btn text-sm font-mono hover:underline cursor-pointer"
                >
                    {isRunning
                        ? formatDuration(elapsedSeconds)
                        : formatDuration(task.totalTime ?? 0)}
                </button>
            </div>
            <ArrivalDialog
                open={showArrivalDialog}
                onOpenChange={setShowArrivalDialog}
                translations={arrivalDialogTranslations}
                hasApprovedWFH={hasApprovedWFH}
                wfhLocation={wfhLocation}
            />
        </>
    )
}
