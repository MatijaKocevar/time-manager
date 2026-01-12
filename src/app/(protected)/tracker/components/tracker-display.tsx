"use client"

import { Play, Square, Clock } from "lucide-react"
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
    translations,
}: TrackerDisplayProps) {
    useTrackerSSE()
    useTrackerPusher()

    const trackerError = useTrackerStore((state) => state.error)

    const { selectedType, selectedTaskId, handleTypeChange, handleTaskChange } =
        useTrackerSelection({
            initialSelectedType,
            initialSelectedTaskId,
        })

    const { activeTimerData, elapsedSeconds, isTimerRunning } = useTimerState({
        initialActiveTimer,
    })

    const { startMutation, stopMutation, isLoading } = useTrackerMutations()

    const { taskEntries } = useTaskTimeEntries(selectedTaskId, initialTodayEntries)

    const canStart =
        !isTimerRunning &&
        (selectedType === "BREAK" || selectedType === "PRIVATE" || selectedType === "WORK")

    const handlePlayStop = () => {
        if (isTimerRunning && activeTimerData) {
            stopMutation.mutate({ entryId: activeTimerData.id })
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
        <>
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {translations.trackingType}
                                </label>
                                <Select
                                    value={selectedType}
                                    onValueChange={handleTypeChange}
                                    disabled={isTimerRunning || isLoading}
                                >
                                    <SelectTrigger className="w-full" suppressHydrationWarning>
                                        <SelectValue>{getTypeLabel(selectedType)}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WORK">{translations.work}</SelectItem>
                                        <SelectItem value="BREAK">{translations.break}</SelectItem>
                                        <SelectItem value="PRIVATE">
                                            {translations.private}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {translations.selectTask}
                                </label>
                                <Select
                                    value={selectedTaskId ?? ""}
                                    onValueChange={handleTaskChange}
                                    disabled={
                                        selectedType !== "WORK" || isTimerRunning || isLoading
                                    }
                                >
                                    <SelectTrigger className="w-full" suppressHydrationWarning>
                                        <SelectValue>{getSelectedTaskLabel()}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
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
                                                    {task.listIcon && (
                                                        <span className="text-xs">
                                                            {task.listIcon}
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`truncate ${task.parentId ? "pl-4" : ""}`}
                                                    >
                                                        {task.parentId && "↳ "}
                                                        {task.title}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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

                        <div className="flex flex-col items-center justify-center gap-6 py-8">
                            <div
                                className="text-6xl font-mono font-bold tabular-nums"
                                suppressHydrationWarning
                            >
                                {formatDuration(elapsedSeconds)}
                            </div>

                            <Button
                                size="lg"
                                onClick={handlePlayStop}
                                disabled={isLoading || (!isTimerRunning && !canStart)}
                                className={`w-28 h-28 rounded-full text-white shadow-lg transition-all ${
                                    isTimerRunning
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-green-600 hover:bg-green-700"
                                }`}
                            >
                                {isTimerRunning ? (
                                    <Square className="h-10 w-10" fill="currentColor" />
                                ) : (
                                    <Play className="h-10 w-10" fill="currentColor" />
                                )}
                            </Button>
                        </div>

                        <div className="min-h-[20px] text-sm text-destructive text-center">
                            {trackerError || ""}
                        </div>

                        <Button
                            variant="outline"
                            onClick={handleViewEntries}
                            className="w-full"
                            disabled={taskEntries.length === 0}
                        >
                            <Clock className="mr-2 h-4 w-4" />
                            {translations.todayEntries} ({taskEntries.length})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <DailySummaryCard
                translations={{
                    title: translations.dailySummaryTitle,
                    work: translations.work,
                    break: translations.break,
                    private: translations.private,
                }}
            />
        </>
    )
}
