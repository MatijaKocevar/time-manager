"use client"

import { useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
import {
    startTracking,
    stopTracking,
    getActiveTrackingEntry,
    getTodayTimeEntries,
} from "../actions/tracker-actions"
import { useTrackerStore } from "../stores/tracker-store"
import { formatDuration, getElapsedSeconds } from "@/app/(protected)/tasks/utils/time-helpers"
import { useTasksStore } from "@/app/(protected)/tasks/stores/tasks-store"
import { taskKeys } from "@/app/(protected)/tasks/query-keys"
import type { TaskDisplay } from "@/app/(protected)/tasks/schemas/task-schemas"
import type { HourType } from "@/../../prisma/generated/client"

interface TrackerDisplayProps {
    inProgressTasks: TaskDisplay[]
    generalWorkTask: { id: string; title: string } | null
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
    translations: {
        selectType: string
        selectTask: string
        trackingType: string
        todayEntries: string
        work: string
        break: string
        private: string
        noTasksAvailable: string
        generalWork: string
    }
}

export function TrackerDisplay({
    inProgressTasks,
    generalWorkTask,
    initialActiveTimer,
    translations,
}: TrackerDisplayProps) {
    const queryClient = useQueryClient()

    const selectedType = useTrackerStore((state) => state.selectedType)
    const selectedTaskId = useTrackerStore((state) => state.selectedTaskId)
    const trackerError = useTrackerStore((state) => state.error)
    const setSelectedType = useTrackerStore((state) => state.setSelectedType)
    const setSelectedTaskId = useTrackerStore((state) => state.setSelectedTaskId)
    const setTrackerError = useTrackerStore((state) => state.setError)
    const checkAndResetForNewDay = useTrackerStore((state) => state.checkAndResetForNewDay)

    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearAllActiveTimers = useTasksStore((state) => state.clearAllActiveTimers)

    const eventSourceRef = useRef<EventSource | null>(null)

    useEffect(() => {
        checkAndResetForNewDay()

        if (!selectedTaskId && generalWorkTask && selectedType === "WORK") {
            setSelectedTaskId(generalWorkTask.id)
        }
    }, [checkAndResetForNewDay, generalWorkTask, selectedTaskId, selectedType, setSelectedTaskId])

    useEffect(() => {
        console.log("[SSE] Setting up EventSource connection")
        const eventSource = new EventSource("/api/tracker/events")
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
            console.log("[SSE] Connected to tracker events, readyState:", eventSource.readyState)
            fetch("/api/tracker/connections")
                .then((r) => r.json())
                .then((data) =>
                    console.log("[SSE] Connection count on server:", data.connectionCount)
                )
                .catch((e) => console.error("[SSE] Failed to check connections:", e))
        }

        eventSource.addEventListener("timer-started", (e) => {
            console.log("[SSE] Received timer-started event:", e.data)
            queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
            queryClient.invalidateQueries({ queryKey: ["tracker", "todayEntries"] })
        })

        eventSource.addEventListener("timer-stopped", (e) => {
            console.log("[SSE] Received timer-stopped event:", e.data)
            queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
            queryClient.invalidateQueries({ queryKey: ["tracker", "todayEntries"] })
        })

        eventSource.onerror = (error) => {
            console.error("[SSE] Connection error:", error, "readyState:", eventSource.readyState)
            if (eventSource.readyState === EventSource.CLOSED) {
                console.error("[SSE] Connection closed by server")
            } else if (eventSource.readyState === EventSource.CONNECTING) {
                console.log("[SSE] Reconnecting...")
            }
        }

        return () => {
            console.log("[SSE] Cleaning up: closing connection")
            eventSource.close()
        }
    }, [queryClient])

    const { data: activeTimerData } = useQuery({
        queryKey: ["tracker", "activeTimer"],
        queryFn: getActiveTrackingEntry,
        initialData: initialActiveTimer,
        refetchOnWindowFocus: false, // SSE handles updates
        refetchOnMount: false,
        staleTime: Infinity, // Never auto-refetch, rely on SSE invalidation
    })

    const { data: todayEntries = [] } = useQuery({
        queryKey: ["tracker", "todayEntries", selectedType],
        queryFn: () => getTodayTimeEntries(selectedType),
        refetchOnWindowFocus: false, // SSE handles updates
        refetchOnMount: false,
        staleTime: Infinity, // Never auto-refetch, rely on SSE invalidation
    })

    const startMutation = useMutation({
        mutationFn: startTracking,
        onMutate: () => {
            setTrackerError("")
        },
        onSuccess: (data) => {
            if (data.error) {
                setTrackerError(data.error)
            } else if (data.success) {
                queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
                queryClient.invalidateQueries({ queryKey: ["tracker", "todayEntries"] })
                queryClient.invalidateQueries({ queryKey: taskKeys.activeTimer() })
            }
        },
        onError: (error) => {
            setTrackerError(error.message)
        },
    })

    const stopMutation = useMutation({
        mutationFn: stopTracking,
        onMutate: () => {
            setTrackerError("")
        },
        onSuccess: (data) => {
            if (data.error) {
                setTrackerError(data.error)
            } else {
                clearAllActiveTimers()
                queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
                queryClient.invalidateQueries({ queryKey: ["tracker", "todayEntries"] })
                queryClient.invalidateQueries({ queryKey: taskKeys.activeTimer() })
            }
        },
        onError: (error) => {
            setTrackerError(error.message)
        },
    })

    const elapsedSeconds = activeTimerData ? getElapsedSeconds(activeTimerData.startTime) : 0

    useEffect(() => {
        if (activeTimerData) {
            setActiveTimer(activeTimerData.taskId, activeTimerData.id, activeTimerData.startTime)

            const interval = setInterval(() => {
                queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
            }, 1000)

            return () => clearInterval(interval)
        }
    }, [activeTimerData, setActiveTimer, queryClient])

    const isTimerRunning = Boolean(activeTimerData)
    const isLoading = startMutation.isPending || stopMutation.isPending

    const canStart =
        !isTimerRunning &&
        (selectedType === "BREAK" || selectedType === "PRIVATE" || selectedType === "WORK")

    const handleTypeChange = (type: string) => {
        setSelectedType(type as HourType)
    }

    const handleTaskChange = (taskId: string) => {
        setSelectedTaskId(taskId)
    }

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
        if (todayEntries.length > 0) {
            const firstEntry = todayEntries[0]
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

    return (
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
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WORK">{translations.work}</SelectItem>
                                    <SelectItem value="BREAK">{translations.break}</SelectItem>
                                    <SelectItem value="PRIVATE">{translations.private}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedType === "WORK" && (
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {translations.selectTask}
                                </label>
                                <Select
                                    value={selectedTaskId ?? ""}
                                    onValueChange={handleTaskChange}
                                    disabled={isTimerRunning || isLoading}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue
                                            placeholder={
                                                inProgressTasks.length === 0
                                                    ? translations.noTasksAvailable
                                                    : translations.selectTask
                                            }
                                        />
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
                        )}
                    </div>

                    {isTimerRunning && activeTimerData && (
                        <div className="space-y-2 p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary">
                                    {getTypeLabel(activeTimerData.type)}
                                </Badge>
                                {!activeTimerData.task.isSystemTask && (
                                    <span className="text-sm text-muted-foreground truncate ml-2">
                                        {activeTimerData.task.title}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

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

                    {trackerError && (
                        <div className="text-sm text-destructive text-center">{trackerError}</div>
                    )}

                    {todayEntries.length > 0 && (
                        <Button variant="outline" onClick={handleViewEntries} className="w-full">
                            <Clock className="mr-2 h-4 w-4" />
                            {translations.todayEntries} ({todayEntries.length})
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
