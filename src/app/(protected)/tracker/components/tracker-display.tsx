"use client"

import { useEffect, useRef, useState } from "react"
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
    saveTrackerPreferences,
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
    initialSelectedType: HourType
    initialSelectedTaskId: string | null
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
    initialSelectedType,
    initialSelectedTaskId,
    initialActiveTimer,
    translations,
}: TrackerDisplayProps) {
    const queryClient = useQueryClient()

    const today = new Date().toISOString().split("T")[0]
    const lastViewed =
        typeof window !== "undefined" ? localStorage.getItem("tracker-last-viewed-date") : null

    const isNewDay = lastViewed !== today

    const getInitialTaskId = () => {
        if (isNewDay) return generalWorkTask?.id ?? null
        if (initialSelectedTaskId) return initialSelectedTaskId
        if (initialSelectedType === "WORK" && generalWorkTask) return generalWorkTask.id
        return null
    }

    const [selectedType, setSelectedType] = useState<HourType>(initialSelectedType)
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(getInitialTaskId())

    const trackerError = useTrackerStore((state) => state.error)
    const setTrackerError = useTrackerStore((state) => state.setError)

    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearAllActiveTimers = useTasksStore((state) => state.clearAllActiveTimers)

    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectCountRef = useRef(0)

    useEffect(() => {
        if (isNewDay) {
            localStorage.setItem("tracker-last-viewed-date", today)
            setTrackerError("")
        }
    }, [isNewDay, today, setTrackerError])

    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: ["tracker", "todayEntries"] })
    }, [selectedTaskId, queryClient])

    useEffect(() => {
        const timestamp = new Date().toISOString()
        console.log(`[SSE ${timestamp}] Setting up EventSource connection to /api/tracker/events`)
        const eventSource = new EventSource("/api/tracker/events")
        eventSourceRef.current = eventSource
        console.log(`[SSE ${timestamp}] EventSource created, readyState: ${eventSource.readyState}`)

        const handleTimerStarted = (e: MessageEvent) => {
            const timestamp = new Date().toISOString()
            console.log(`[SSE ${timestamp}] Received timer-started event:`, e.data)
            try {
                const data = JSON.parse(e.data)
                console.log(`[SSE ${timestamp}] Parsed data:`, data)
                if (data.type && data.taskId) {
                    console.log(
                        `[SSE ${timestamp}] Syncing store: type = ${data.type}, taskId = ${data.taskId}`
                    )
                    setSelectedType(data.type)
                    setSelectedTaskId(data.taskId)
                    console.log(`[SSE ${timestamp}] Store updated successfully`)
                } else {
                    console.warn(`[SSE ${timestamp}] Missing type or taskId in event data:`, data)
                }
            } catch (error) {
                console.error(`[SSE ${timestamp}] Failed to parse timer-started data:`, error)
            }
            console.log(`[SSE ${timestamp}] Invalidating queries...`)
            queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
            queryClient.invalidateQueries({ queryKey: ["tracker", "todayEntries"] })
            console.log(`[SSE ${timestamp}] Queries invalidated`)
        }

        const handleTimerStopped = (e: MessageEvent) => {
            const timestamp = new Date().toISOString()
            console.log(`[SSE ${timestamp}] Received timer-stopped event:`, e.data)
            console.log(`[SSE ${timestamp}] Invalidating queries...`)
            queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
            queryClient.invalidateQueries({ queryKey: ["tracker", "todayEntries"] })
            console.log(`[SSE ${timestamp}] Queries invalidated`)
        }

        eventSource.onopen = () => {
            const timestamp = new Date().toISOString()
            const reconnectCount = reconnectCountRef.current
            console.log(
                `[SSE ${timestamp}] Connected to tracker events, readyState: ${eventSource.readyState}, reconnect count: ${reconnectCount}`
            )

            // If this is a reconnection (not the first connection), invalidate queries to sync state
            if (reconnectCount > 0) {
                console.log(`[SSE ${timestamp}] Reconnected - invalidating queries to sync state`)
                queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
                queryClient.invalidateQueries({ queryKey: ["tracker", "todayEntries"] })
                console.log(`[SSE ${timestamp}] Reconnection queries invalidated`)
            }

            reconnectCountRef.current += 1

            fetch("/api/tracker/connections")
                .then((r) => r.json())
                .then((data) =>
                    console.log(
                        `[SSE ${timestamp}] Connection count on server: ${data.connectionCount}`
                    )
                )
                .catch((e) => console.error(`[SSE ${timestamp}] Failed to check connections:`, e))
        }

        eventSource.addEventListener("timer-started", handleTimerStarted)
        eventSource.addEventListener("timer-stopped", handleTimerStopped)

        eventSource.onerror = (error) => {
            const timestamp = new Date().toISOString()
            console.error(
                `[SSE ${timestamp}] Connection error:`,
                error,
                `readyState: ${eventSource.readyState}`
            )
            if (eventSource.readyState === EventSource.CLOSED) {
                console.error(`[SSE ${timestamp}] Connection closed by server, will auto-reconnect`)
            } else if (eventSource.readyState === EventSource.CONNECTING) {
                console.log(`[SSE ${timestamp}] Reconnecting...`)
            } else {
                console.error(`[SSE ${timestamp}] Unknown error state: ${eventSource.readyState}`)
            }
        }

        return () => {
            const timestamp = new Date().toISOString()
            console.log(`[SSE ${timestamp}] Cleaning up: closing connection`)
            eventSource.removeEventListener("timer-started", handleTimerStarted)
            eventSource.removeEventListener("timer-stopped", handleTimerStopped)
            eventSource.close()
            console.log(`[SSE ${timestamp}] Connection closed and cleaned up`)
        }
    }, [queryClient, setSelectedType, setSelectedTaskId])

    const { data: activeTimerData } = useQuery({
        queryKey: ["tracker", "activeTimer"],
        queryFn: getActiveTrackingEntry,
        initialData: initialActiveTimer,
        refetchOnWindowFocus: false, // SSE handles updates
        refetchOnMount: false,
        staleTime: Infinity, // Never auto-refetch, rely on SSE invalidation
    })

    const { data: todayEntries = [] } = useQuery({
        queryKey: ["tracker", "todayEntries", selectedType, selectedTaskId],
        queryFn: () => getTodayTimeEntries(selectedType, selectedTaskId ?? undefined),
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
        const newType = type as HourType
        setSelectedType(newType)
        setSelectedTaskId(null)
        saveTrackerPreferences(newType, null)
    }

    const handleTaskChange = (taskId: string) => {
        setSelectedTaskId(taskId)
        saveTrackerPreferences(selectedType, taskId)
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

    const getSelectedTaskLabel = () => {
        if (!selectedTaskId) return translations.selectTask

        if (generalWorkTask && selectedTaskId === generalWorkTask.id) {
            return translations.generalWork
        }

        const task = inProgressTasks.find((t) => t.id === selectedTaskId)
        return task ? task.title : translations.selectTask
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

                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                {translations.selectTask}
                            </label>
                            <Select
                                value={selectedTaskId ?? ""}
                                onValueChange={handleTaskChange}
                                disabled={selectedType !== "WORK" || isTimerRunning || isLoading}
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
                                                    <span className="text-xs">{task.listIcon}</span>
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
                        disabled={todayEntries.length === 0}
                    >
                        <Clock className="mr-2 h-4 w-4" />
                        {translations.todayEntries} ({todayEntries.length})
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
