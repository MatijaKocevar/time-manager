"use client"

import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Play, Square } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getActiveTimer } from "@/app/(protected)/tasks/actions/task-time-actions"
import { startTimer, stopTimer } from "@/app/(protected)/tasks/actions/task-time-actions"
import { taskKeys } from "@/app/(protected)/tasks/query-keys"
import { useTasksStore } from "@/app/(protected)/tasks/stores/tasks-store"
import { useTrackerStore } from "../stores/tracker-store"
import { formatDuration, getElapsedSeconds } from "@/app/(protected)/tasks/utils/time-helpers"
import type { TaskTimeEntryDisplay } from "@/app/(protected)/tasks/schemas/task-time-entry-schemas"
import type { TaskDisplay } from "@/app/(protected)/tasks/schemas/task-schemas"

interface TrackerDisplayProps {
    tasks: TaskDisplay[]
    initialActiveTimer: TaskTimeEntryDisplay | null
}

export function TrackerDisplay({ tasks, initialActiveTimer }: TrackerDisplayProps) {
    const queryClient = useQueryClient()
    const t = useTranslations("tasks.tracker")

    const activeTimers = useTasksStore((state) => state.activeTimers)
    const elapsedTimes = useTasksStore((state) => state.elapsedTimes)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearAllActiveTimers = useTasksStore((state) => state.clearAllActiveTimers)
    const updateElapsedTime = useTasksStore((state) => state.updateElapsedTime)
    const syncActiveTimerFromServer = useTasksStore((state) => state.syncActiveTimerFromServer)

    const selectedTaskId = useTrackerStore((state) => state.selectedTaskId)
    const trackerError = useTrackerStore((state) => state.error)
    const setTrackerError = useTrackerStore((state) => state.setError)
    const initializeSelectedTask = useTrackerStore((state) => state.initializeSelectedTask)

    const { data: activeTimerData } = useQuery({
        queryKey: taskKeys.activeTimer(),
        queryFn: getActiveTimer,
        refetchInterval: 5000,
        initialData: initialActiveTimer,
    })

    const startMutation = useMutation({
        mutationFn: startTimer,
        onMutate: async () => {
            setTrackerError("")
            await queryClient.cancelQueries({ queryKey: taskKeys.activeTimer() })
            const previousTimer = queryClient.getQueryData(taskKeys.activeTimer())
            return { previousTimer }
        },
        onSuccess: (data, variables) => {
            if (data.error) {
                setTrackerError(data.error)
            } else if (data.success && data.entryId) {
                clearAllActiveTimers()
                setActiveTimer(variables.taskId, data.entryId, new Date())
                queryClient.invalidateQueries({ queryKey: taskKeys.activeTimer() })
            }
        },
        onError: (error, _variables, context) => {
            setTrackerError(error.message)
            if (context?.previousTimer) {
                queryClient.setQueryData(taskKeys.activeTimer(), context.previousTimer)
            }
        },
    })

    const stopMutation = useMutation({
        mutationFn: stopTimer,
        onMutate: async () => {
            setTrackerError("")
            await queryClient.cancelQueries({ queryKey: taskKeys.activeTimer() })
            const previousTimer = queryClient.getQueryData(taskKeys.activeTimer())
            return { previousTimer }
        },
        onSuccess: (data) => {
            if (data.error) {
                setTrackerError(data.error)
            } else {
                clearAllActiveTimers()
                queryClient.invalidateQueries({ queryKey: taskKeys.activeTimer() })
            }
        },
        onError: (error, _variables, context) => {
            setTrackerError(error.message)
            if (context?.previousTimer) {
                queryClient.setQueryData(taskKeys.activeTimer(), context.previousTimer)
            }
        },
    })

    useEffect(() => {
        syncActiveTimerFromServer(
            activeTimerData,
            activeTimers,
            clearAllActiveTimers,
            setActiveTimer
        )
    }, [
        activeTimerData,
        activeTimers,
        clearAllActiveTimers,
        setActiveTimer,
        syncActiveTimerFromServer,
    ])

    useEffect(() => {
        const interval = setInterval(() => {
            activeTimers.forEach((timer, taskId) => {
                const elapsed = getElapsedSeconds(timer.startTime)
                updateElapsedTime(taskId, elapsed)
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [activeTimers, updateElapsedTime])

    useEffect(() => {
        initializeSelectedTask(activeTimerData?.taskId, selectedTaskId, tasks)
    }, [activeTimerData, selectedTaskId, tasks, initializeSelectedTask])

    const activeTaskId = activeTimerData?.taskId
    const isTimerRunning = Boolean(activeTaskId)
    const activeTimerEntry = activeTimerData as TaskTimeEntryDisplay | null

    const displayedTaskId = activeTaskId ?? selectedTaskId ?? tasks[0]?.id
    const displayedTask = tasks.find((task) => task.id === displayedTaskId)
    const elapsedSeconds = displayedTaskId ? (elapsedTimes.get(displayedTaskId) ?? 0) : 0

    const isLoading = startMutation.isPending || stopMutation.isPending

    const handlePlayStop = () => {
        if (isTimerRunning && activeTimerEntry) {
            stopMutation.mutate({ id: activeTimerEntry.id })
        } else if (selectedTaskId) {
            startMutation.mutate({ taskId: selectedTaskId })
        }
    }

    if (!displayedTask) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center space-y-4 py-8">
                        <p className="text-muted-foreground">{t("noTasksAvailable")}</p>
                        <p className="text-sm text-muted-foreground">{t("createTaskToTrack")}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4 md:space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            {displayedTask.listName && (
                                <Badge
                                    variant="outline"
                                    style={{
                                        borderColor: displayedTask.listColor ?? undefined,
                                        color: displayedTask.listColor ?? undefined,
                                    }}
                                >
                                    {displayedTask.listIcon && (
                                        <span className="mr-1">{displayedTask.listIcon}</span>
                                    )}
                                    {displayedTask.listName}
                                </Badge>
                            )}
                            <Badge variant="secondary">{displayedTask.status}</Badge>
                        </div>
                        <h2 className="text-xl md:text-2xl font-semibold">{displayedTask.title}</h2>
                        {displayedTask.description && (
                            <p className="text-sm text-muted-foreground">
                                {displayedTask.description}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 py-4">
                        <div className="text-4xl md:text-6xl font-mono font-bold tabular-nums">
                            {formatDuration(elapsedSeconds)}
                        </div>

                        <Button
                            size="lg"
                            onClick={handlePlayStop}
                            disabled={isLoading || !selectedTaskId}
                            className={`w-24 h-24 md:w-28 md:h-28 rounded-full text-white shadow-lg transition-all ${
                                isTimerRunning
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-green-600 hover:bg-green-700"
                            }`}
                        >
                            {isTimerRunning ? (
                                <Square className="w-10 h-10 md:w-12 md:h-12" />
                            ) : (
                                <Play className="w-10 h-10 md:w-12 md:h-12 ml-1" />
                            )}
                        </Button>
                    </div>

                    {trackerError && (
                        <div className="text-sm text-red-600 text-center">{trackerError}</div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
