"use client"

import { useState, useMemo } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Play, Square } from "lucide-react"
import { useTranslations } from "next-intl"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrivalDialog } from "@/components/arrival-dialog"
import { formatDuration } from "../../tasks/utils/time-helpers"
import { useTasksStore } from "../../tasks/stores/tasks-store"
import { useTimeSheetsStore } from "../stores/time-sheets-store"
import { startTimer, stopTimer } from "@/app/(protected)/shared/actions/timer-actions"
import { taskKeys } from "../../tasks/query-keys"
import { timeSheetKeys } from "../query-keys"
import { TaskStatusSelect } from "../../tasks/components/task-status-select"
import {
    isWeekend,
    isToday,
    formatDateKey,
    formatDateHeader,
    buildHolidayMap,
    getHolidayForDate,
} from "../utils/date-helpers"
import type { AggregatedTimeSheet } from "../utils/aggregation-helpers"

interface TimeSheetsTableProps {
    aggregatedData: AggregatedTimeSheet
    isLoading: boolean
    error: string | null
    currentTime: Date
    formatHoursMinutes: (seconds: number) => string
    holidays?: Array<{ date: Date; name: string }>
    userWorkHoursPerDay: number
    translations: {
        task: string
        total: string
        dailyTotal: string
        overtime: string
        undertime: string
        noData: string
    }
}

export function TimeSheetsTable({
    aggregatedData,
    isLoading,
    error,
    currentTime,
    formatHoursMinutes,
    holidays = [],
    userWorkHoursPerDay,
    translations,
}: TimeSheetsTableProps) {
    const [showArrivalDialog, setShowArrivalDialog] = useState(false)
    const [hasApprovedWFH, setHasApprovedWFH] = useState<boolean>(false)
    const [wfhLocation, setWfhLocation] = useState<string | null>(null)
    const queryClient = useQueryClient()
    const tClock = useTranslations("clock")
    const tCommon = useTranslations("common")
    const openTimeEntriesDialog = useTasksStore((state) => state.openTimeEntriesDialog)
    const activeTimer = useTasksStore((state) => state.activeTimer)
    const openDayEntriesDialog = useTimeSheetsStore((state) => state.openDayEntriesDialog)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearActiveTimer = useTasksStore((state) => state.clearActiveTimer)
    const [loadingTask, setLoadingTask] = useState<string | null>(null)

    const { tasks, dates } = aggregatedData

    const startMutation = useMutation({
        mutationFn: startTimer,
        onSuccess: (data, variables) => {
            if (data.success && data.entryId && variables.taskId) {
                clearActiveTimer()
                setActiveTimer(variables.taskId, data.entryId, new Date())
                queryClient.invalidateQueries({ queryKey: taskKeys.activeTimer() })
                queryClient.invalidateQueries({ queryKey: timeSheetKeys.all })

                if (data.shouldShowArrivalDialog) {
                    setHasApprovedWFH(data.hasApprovedWFH ?? false)
                    setWfhLocation(data.wfhLocation ?? null)
                    setShowArrivalDialog(true)
                }
            }
            setLoadingTask(null)
        },
        onError: () => {
            setLoadingTask(null)
        },
    })

    const stopMutation = useMutation({
        mutationFn: stopTimer,
        onSuccess: () => {
            clearActiveTimer()
            queryClient.invalidateQueries({ queryKey: taskKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: timeSheetKeys.all })
            setLoadingTask(null)
        },
        onError: () => {
            setLoadingTask(null)
        },
    })

    const tasksArray = Array.from(tasks.values()).sort(
        (a, b) => a.firstTrackedAt.getTime() - b.firstTrackedAt.getTime()
    )

    const dailyTotals = aggregatedData.dailyTotals

    const holidaysByDate = useMemo(() => buildHolidayMap(holidays), [holidays])

    const isHoliday = (date: Date) => {
        return getHolidayForDate(date, holidaysByDate)
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
            <div id="time-sheets-table" className="border rounded-lg overflow-auto h-full">
                <Table>
                    <colgroup>
                        <col style={{ width: "180px", minWidth: "150px", maxWidth: "200px" }} />
                        {dates.map((dateStr) => (
                            <col key={dateStr} style={{ width: "100px", minWidth: "100px" }} />
                        ))}
                        <col style={{ width: "100px", minWidth: "100px" }} />
                    </colgroup>
                    <TableHeader
                        id="time-sheets-table-header"
                        className="sticky top-0 z-30 bg-background"
                    >
                        <TableRow>
                            <TableHead className="sticky left-0 z-40 bg-background border-r font-semibold min-w-[150px] max-w-[200px] py-2">
                                {translations.task}
                            </TableHead>
                            {dates.map((dateStr) => {
                                const date = new Date(dateStr)
                                const isWeekendDay = isWeekend(date)
                                const isTodayDay = isToday(date)
                                const holiday = isHoliday(date)
                                const totalSeconds = dailyTotals.get(dateStr) ?? 0
                                const totalHours = totalSeconds / 3600

                                return (
                                    <TableHead
                                        key={dateStr}
                                        className={`time-sheets-date-header text-center min-w-[100px] relative py-2 ${
                                            isWeekendDay ? "bg-muted/50" : ""
                                        } ${holiday ? "bg-orange-100 dark:bg-orange-950" : ""} ${isTodayDay ? "bg-blue-50 dark:bg-blue-950" : ""}`}
                                    >
                                        {totalHours > 0 && (
                                            <div className="absolute top-0 left-0 right-0 h-0.5 flex">
                                                <div
                                                    className="bg-blue-500"
                                                    style={{
                                                        width: `${Math.min((totalHours / userWorkHoursPerDay) * 100, 100)}%`,
                                                    }}
                                                    suppressHydrationWarning
                                                />
                                                {totalHours > userWorkHoursPerDay && (
                                                    <div
                                                        className="bg-red-500"
                                                        style={{
                                                            width: `${((totalHours - userWorkHoursPerDay) / userWorkHoursPerDay) * 100}%`,
                                                        }}
                                                        suppressHydrationWarning
                                                    />
                                                )}
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-0.5 items-center">
                                            <div>{formatDateHeader(date)}</div>
                                            <div
                                                className="text-xs font-normal text-muted-foreground h-4 cursor-pointer hover:text-foreground transition-colors"
                                                onClick={() => {
                                                    if (totalSeconds > 0) {
                                                        openDayEntriesDialog(date.toISOString())
                                                    }
                                                }}
                                                suppressHydrationWarning
                                            >
                                                {totalSeconds > 0
                                                    ? formatHoursMinutes(totalSeconds)
                                                    : ""}
                                            </div>
                                        </div>
                                    </TableHead>
                                )
                            })}
                            <TableHead className="text-center min-w-[100px] font-semibold bg-background border-l py-2">
                                {translations.total}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={dates.length + 2} className="h-64">
                                    <LoadingSpinner size="lg" />
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell
                                    colSpan={dates.length + 2}
                                    className="h-64 text-center text-destructive"
                                >
                                    {error}
                                </TableCell>
                            </TableRow>
                        ) : tasksArray.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={dates.length + 2}
                                    className="h-64 text-center text-muted-foreground"
                                >
                                    {translations.noData}
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {tasksArray.map((task) => {
                                    const dotColor =
                                        task.status === "DONE"
                                            ? "bg-green-500"
                                            : task.status === "IN_PROGRESS"
                                              ? "bg-blue-500"
                                              : task.status === "ON_HOLD"
                                                ? "bg-yellow-500"
                                                : task.status === "CANCELED"
                                                  ? "bg-red-500"
                                                  : "bg-gray-400"

                                    const isTracking = activeTimer?.taskId === task.taskId
                                    const isLoadingThis = loadingTask === task.taskId

                                    return (
                                        <TableRow key={task.taskId} className="group">
                                            <TableCell className="sticky left-0 z-10 bg-background border-r py-2 min-w-[150px] max-w-[200px]">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-start gap-2 min-w-0">
                                                        <div
                                                            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`}
                                                        />
                                                        <div className="flex flex-col gap-0.5 min-w-0">
                                                            <span className="font-medium text-sm leading-tight truncate">
                                                                {task.taskTitle}
                                                            </span>
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <div
                                                                    className="inline-flex [&_button]:!h-auto [&_button]:!p-0 [&_button]:!m-0 [&_button]:!text-xs [&_button]:!font-normal [&_button]:!border-0 [&_button]:!shadow-none [&_button]:!bg-transparent [&_button]:hover:!bg-transparent [&_button]:hover:underline [&_button]:!text-muted-foreground [&_svg]:!hidden [&_button]:!w-auto [&_button]:!min-h-0 [&_button]:!gap-0 [&_div]:!border-0 [&_div]:!bg-transparent [&_div]:!p-0 [&_div]:!m-0 [&_div]:!text-xs [&_div]:!font-normal [&_div]:!h-auto [&_div]:!rounded-none [&_div]:!shadow-none [&_div]:!gap-0 [&_*]:!border-0 [&_*]:!bg-transparent [&_*]:!shadow-none"
                                                                    onClick={(e) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    <TaskStatusSelect
                                                                        task={{
                                                                            id: task.taskId,
                                                                            userId: "",
                                                                            listId: null,
                                                                            title: task.taskTitle,
                                                                            description: null,
                                                                            status: task.status,
                                                                            parentId: null,
                                                                            order: 0,
                                                                            isExpanded: false,
                                                                            createdAt: new Date(),
                                                                            updatedAt: new Date(),
                                                                            subtasks: [],
                                                                            depth: 0,
                                                                        }}
                                                                    />
                                                                </div>
                                                                {task.listName &&
                                                                    task.listName !== "No List" && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>
                                                                                {task.listName}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant={
                                                            isTracking ? "destructive" : "ghost"
                                                        }
                                                        size="sm"
                                                        className={`h-6 w-6 p-0 flex-shrink-0 transition-opacity ${
                                                            isTracking
                                                                ? "opacity-100"
                                                                : "opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                                        }`}
                                                        disabled={isLoadingThis}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (isTracking && activeTimer) {
                                                                setLoadingTask(task.taskId)
                                                                stopMutation.mutate({
                                                                    id: activeTimer.entryId,
                                                                })
                                                            } else {
                                                                setLoadingTask(task.taskId)
                                                                startMutation.mutate({
                                                                    taskId: task.taskId,
                                                                })
                                                            }
                                                        }}
                                                    >
                                                        {isLoadingThis ? (
                                                            <LoadingSpinner className="h-3 w-3" />
                                                        ) : isTracking ? (
                                                            <Square className="h-3 w-3" />
                                                        ) : (
                                                            <Play className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            {dates.map((dateStr) => {
                                                const date = new Date(dateStr)
                                                const dateKey = formatDateKey(date)
                                                const durationInSeconds = task.byDate.get(dateKey)
                                                const isWeekendDay = isWeekend(date)
                                                const isTodayDay = isToday(date)
                                                const holiday = isHoliday(date)

                                                const displayDuration =
                                                    isTracking && isTodayDay && activeTimer
                                                        ? Math.floor(
                                                              (currentTime.getTime() -
                                                                  activeTimer.startTime.getTime()) /
                                                                  1000
                                                          )
                                                        : durationInSeconds

                                                return (
                                                    <TableCell
                                                        key={dateStr}
                                                        className={`text-center tabular-nums ${
                                                            isWeekendDay ? "bg-muted/50" : ""
                                                        } ${holiday ? "bg-orange-100 dark:bg-orange-950" : ""} ${
                                                            isTodayDay
                                                                ? "bg-blue-50 dark:bg-blue-950"
                                                                : ""
                                                        }`}
                                                    >
                                                        <span
                                                            className={`time-sheets-task-cell ${
                                                                displayDuration
                                                                    ? "cursor-pointer hover:underline"
                                                                    : ""
                                                            }`}
                                                            onClick={() => {
                                                                if (displayDuration) {
                                                                    openTimeEntriesDialog(
                                                                        task.taskId
                                                                    )
                                                                }
                                                            }}
                                                            suppressHydrationWarning
                                                        >
                                                            {displayDuration
                                                                ? formatDuration(displayDuration)
                                                                : "-"}
                                                        </span>
                                                    </TableCell>
                                                )
                                            })}
                                            <TableCell
                                                className="text-center font-semibold tabular-nums bg-background border-l"
                                                suppressHydrationWarning
                                            >
                                                {formatHoursMinutes(task.totalDuration)}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </>
                        )}
                    </TableBody>
                </Table>
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
