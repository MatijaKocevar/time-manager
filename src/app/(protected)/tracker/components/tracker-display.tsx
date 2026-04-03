"use client"

import { useState } from "react"
import { Play, Square, Clock, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrivalDialog } from "@/components/arrival-dialog"
import { useTrackerStore } from "../stores/tracker-store"
import { formatDuration } from "@/app/(protected)/tasks/utils/time-helpers"
import { useTasksStore } from "@/app/(protected)/tasks/stores/tasks-store"
import type { HourType } from "@/../../prisma/generated/client"
import {
    useTrackerSSE,
    useTrackerPusher,
    useTimerState,
    useTrackerMutations,
    useTaskTimeEntries,
    useTrackerSelection,
} from "../hooks"
import type { TrackerDisplayProps } from "../types/tracker-display.types"
import { DailySummaryCard } from "./daily-summary-card"

export function TrackerDisplay({
    inProgressTasks,
    generalWorkTask,
    initialSelectedType,
    initialSelectedTaskId,
    initialActiveTimer,
    initialTodayEntries,
    initialDailySummary,
    translations,
}: TrackerDisplayProps) {
    const [showArrivalDialog, setShowArrivalDialog] = useState(false)
    const [hasApprovedWFH, setHasApprovedWFH] = useState(false)
    const [wfhLocation, setWfhLocation] = useState<string | null>(null)

    useTrackerSSE()
    useTrackerPusher()

    const trackerError = useTrackerStore((state) => state.error)

    const { activeTimerData, elapsedSeconds, isTimerRunning } = useTimerState({
        initialActiveTimer,
    })

    const { selectedType, selectedTaskId, handleTypeChange, handleTaskChange } =
        useTrackerSelection({
            initialSelectedType,
            initialSelectedTaskId,
            activeTimerData: activeTimerData
                ? {
                      type: activeTimerData.type,
                      taskId: activeTimerData.taskId,
                  }
                : null,
        })

    const { startMutation, stopMutation, isLoading } = useTrackerMutations((hasWFH, location) => {
        setHasApprovedWFH(hasWFH)
        setWfhLocation(location)
        setShowArrivalDialog(true)
    })

    const { taskEntries } = useTaskTimeEntries(selectedTaskId, initialTodayEntries)

    const isTrackingCurrentSelection =
        isTimerRunning &&
        activeTimerData &&
        activeTimerData.type === selectedType &&
        activeTimerData.taskId === selectedTaskId

    const canStart =
        selectedType === "BREAK" || selectedType === "PRIVATE" || selectedType === "WORK"

    const handlePlayStop = () => {
        if (isTrackingCurrentSelection && activeTimerData) {
            stopMutation.mutate({ id: activeTimerData.id })
        } else if (canStart) {
            startMutation.mutate({
                type: selectedType,
                taskId: selectedType === "WORK" ? (selectedTaskId ?? undefined) : undefined,
            })
        }
    }

    const handleViewEntries = () => {
        if (taskEntries.length > 0) {
            const firstEntry = taskEntries[0]
            useTasksStore.getState().openTimeEntriesDialog(firstEntry.taskId)
        }
    }

    const getTypeLabel = (type: HourType) => {
        switch (type) {
            case "WORK":
                return translations.work
            case "BREAK":
                return translations.break
            case "PRIVATE":
                return translations.private
            default:
                return type
        }
    }

    const getSelectedTaskLabel = () => {
        if (!selectedTaskId) return translations.selectTask

        if (generalWorkTask && selectedTaskId === generalWorkTask.id) {
            return translations.generalWork
        }

        const task = inProgressTasks.find((t) => t.id === selectedTaskId)
        return task ? task.title : translations.selectTask
    }

    return (
        <Card className="h-full">
            <CardContent className="pt-4 h-full overflow-auto xl:overflow-visible flex flex-col">
                <div className="space-y-4 flex-1 min-h-0 flex flex-col">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                {translations.trackingType}
                            </label>
                            <Select
                                value={selectedType}
                                onValueChange={handleTypeChange}
                                disabled={isLoading}
                            >
                                <SelectTrigger className="w-full" suppressHydrationWarning>
                                    <SelectValue>{getTypeLabel(selectedType)}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WORK">{translations.work}</SelectItem>
                                    <SelectItem value="BREAK">{translations.break}</SelectItem>
                                    <SelectItem value="PRIVATE">{translations.private}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-[1fr_auto] gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {translations.selectTask}
                                </label>
                                <Select
                                    value={selectedTaskId ?? ""}
                                    onValueChange={handleTaskChange}
                                    disabled={selectedType !== "WORK" || isLoading}
                                >
                                    <SelectTrigger className="w-full" suppressHydrationWarning>
                                        <SelectValue>{getSelectedTaskLabel()}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {generalWorkTask && (
                                            <SelectItem value={generalWorkTask.id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate">
                                                        {translations.generalWork}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        )}
                                        {inProgressTasks.map((task) => (
                                            <SelectItem key={task.id} value={task.id}>
                                                <div className="flex items-center gap-2">
                                                    {task.listColor && (
                                                        <span
                                                            className="h-2 w-2 rounded-full flex-shrink-0"
                                                            style={{
                                                                backgroundColor: task.listColor,
                                                            }}
                                                        />
                                                    )}
                                                    <span
                                                        className={`truncate ${task.parentId ? "pl-4" : ""}`}
                                                    >
                                                        {task.parentId && "↳ "}
                                                        {task.title}
                                                    </span>
                                                    {task.listIsPrivate && (
                                                        <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block opacity-0">
                                    -
                                </label>
                                <Button
                                    variant="outline"
                                    onClick={handleViewEntries}
                                    disabled={taskEntries.length === 0}
                                >
                                    <Clock className="mr-2 h-4 w-4" />
                                    {translations.todayEntries} ({taskEntries.length})
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 p-4 bg-muted rounded-lg min-h-[60px] flex items-center">
                        {isTimerRunning && activeTimerData ? (
                            <div className="flex items-center justify-between w-full">
                                <Badge variant="secondary">
                                    {getTypeLabel(activeTimerData.type)}
                                </Badge>
                                <span className="text-sm text-muted-foreground truncate ml-2">
                                    {!activeTimerData.task.isSystemTask
                                        ? activeTimerData.task.title
                                        : ""}
                                </span>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground opacity-0">-</div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-center flex-1 xl:min-h-0">
                        <div className="flex flex-col items-center justify-center gap-6 py-8">
                            <div
                                className="text-6xl font-mono font-bold tabular-nums"
                                suppressHydrationWarning
                            >
                                {formatDuration(isTrackingCurrentSelection ? elapsedSeconds : 0)}
                            </div>

                            <Button
                                size="lg"
                                onClick={handlePlayStop}
                                disabled={isLoading || (!isTrackingCurrentSelection && !canStart)}
                                className={`w-28 h-28 rounded-full text-white shadow-lg transition-all ${
                                    isTrackingCurrentSelection
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-green-600 hover:bg-green-700"
                                }`}
                            >
                                {isTrackingCurrentSelection ? (
                                    <Square className="h-10 w-10" fill="currentColor" />
                                ) : (
                                    <Play className="h-10 w-10" fill="currentColor" />
                                )}
                            </Button>
                        </div>

                        <div className="xl:col-span-2">
                            <DailySummaryCard
                                initialData={initialDailySummary}
                                translations={{
                                    title: translations.dailySummaryTitle,
                                    work: translations.work,
                                    break: translations.break,
                                    private: translations.private,
                                }}
                            />
                        </div>
                    </div>

                    <div className="min-h-[20px] text-sm text-destructive text-center">
                        {trackerError || ""}
                    </div>
                </div>
            </CardContent>
            <ArrivalDialog
                open={showArrivalDialog}
                onOpenChange={setShowArrivalDialog}
                hasApprovedWFH={hasApprovedWFH}
                wfhLocation={wfhLocation}
                translations={{
                    title: translations.arrivalDialogTitle,
                    message: translations.arrivalDialogMessage,
                    yesButton: translations.arrivalDialogYes,
                    noButton: translations.arrivalDialogNo,
                    successMessage: translations.arrivalDialogSuccess,
                    errorTitle: translations.errorTitle,
                    workFromHomeCheckbox: translations.arrivalDialogWorkFromHome,
                    workFromHomeApproved: translations.arrivalDialogWorkFromHomeApproved,
                }}
            />
        </Card>
    )
}
