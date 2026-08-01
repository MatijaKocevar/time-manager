"use client"

import { useState } from "react"
import { Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ArrivalDialog } from "@/components/arrival-dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatDuration } from "@/app/(protected)/tasks/_utils/time-helpers"
import {
    useTimerState,
    useTrackerSSE,
    useTrackerPusher,
    useTrackerMutations,
} from "@/app/(protected)/tracker/_hooks"
import type { HourType } from "@/../../prisma/generated/client"
import type { TaskDisplay } from "@/app/(protected)/tasks/_schemas"
import { TaskSelectorDropdown } from "./task-selector-dropdown"

interface TimerStatusCompactProps {
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
    inProgressTasks: TaskDisplay[]
    translations: {
        startTracking: string
        selectTask: string
        noTasksInProgress: string
        arrivalDialog: {
            title: string
            message: string
            yesButton: string
            noButton: string
            successMessage: string
            errorTitle: string
            workFromHomeCheckbox: string
            workFromHomeApproved: string
        }
    }
}

export function TimerStatusCompact({
    initialActiveTimer,
    inProgressTasks,
    translations,
}: TimerStatusCompactProps) {
    const [showArrivalDialog, setShowArrivalDialog] = useState(false)
    const [hasApprovedWFH, setHasApprovedWFH] = useState(false)
    const [wfhLocation, setWfhLocation] = useState<string | null>(null)
    const isMobile = useIsMobile()

    useTrackerSSE()
    useTrackerPusher()

    const { activeTimerData, elapsedSeconds, isTimerRunning } = useTimerState({
        initialActiveTimer,
    })

    const { startMutation, stopMutation, isLoading } = useTrackerMutations((hasWFH, location) => {
        setHasApprovedWFH(hasWFH)
        setWfhLocation(location)
        setShowArrivalDialog(true)
    })

    const handleStop = () => {
        if (activeTimerData) {
            stopMutation.mutate({ id: activeTimerData.id })
        }
    }

    const handleSelectTask = (taskId: string) => {
        startMutation.mutate({ taskId })
    }

    if (!isTimerRunning) {
        return (
            <>
                <TaskSelectorDropdown
                    tasks={inProgressTasks}
                    onSelectTask={handleSelectTask}
                    isLoading={isLoading}
                    translations={{
                        selectTask: translations.selectTask,
                        noTasksInProgress: translations.noTasksInProgress,
                    }}
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        disabled={isLoading}
                        aria-label={translations.startTracking}
                    >
                        <Play className="h-4 w-4 text-muted-foreground" />
                        {!isMobile && (
                            <span className="text-sm text-muted-foreground hidden md:inline">
                                {translations.startTracking}
                            </span>
                        )}
                    </Button>
                </TaskSelectorDropdown>
            </>
        )
    }

    return (
        <>
            <div className="flex items-center gap-2 border rounded-md px-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStop}
                    disabled={isLoading}
                    aria-label="Stop tracking time"
                >
                    <Square className="h-4 w-4 fill-current text-red-500" />
                </Button>
                {!isMobile && (
                    <span className="text-sm font-medium tabular-nums hidden md:inline">
                        {formatDuration(elapsedSeconds)}
                    </span>
                )}
            </div>
            <ArrivalDialog
                open={showArrivalDialog}
                onOpenChange={setShowArrivalDialog}
                hasApprovedWFH={hasApprovedWFH}
                wfhLocation={wfhLocation}
                translations={translations.arrivalDialog}
            />
        </>
    )
}
