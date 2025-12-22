"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDuration } from "../../tasks/utils/time-helpers"
import { useTasksStore } from "../../tasks/stores/tasks-store"
import { isWeekend, isToday, formatDateKey, formatDateHeader } from "../utils/date-helpers"
import type { AggregatedTimeSheet } from "../utils/aggregation-helpers"

interface TimeSheetsTableProps {
    aggregatedData: AggregatedTimeSheet
    isLoading: boolean
    error: string | null
    translations: {
        task: string
        noData: string
    }
}

export function TimeSheetsTable({
    aggregatedData,
    isLoading,
    error,
    translations,
}: TimeSheetsTableProps) {
    const openTimeEntriesDialog = useTasksStore((state) => state.openTimeEntriesDialog)

    const { tasks, dates } = aggregatedData

    const tasksArray = Array.from(tasks.values())

    const dailyTotals = new Map<string, number>()
    dates.forEach((dateStr) => {
        let total = 0
        tasksArray.forEach((task) => {
            const dateKey = formatDateKey(new Date(dateStr))
            const duration = task.byDate.get(dateKey) ?? 0
            total += duration
        })
        dailyTotals.set(dateStr, total)
    })

    return (
        <div className="border rounded-lg overflow-auto h-full">
            <Table>
                <TableHeader className="sticky top-0 z-30 bg-background">
                    <TableRow>
                        <TableHead className="sticky left-0 z-40 bg-background border-r font-semibold min-w-[250px]">
                            {translations.task}
                        </TableHead>
                        {dates.map((dateStr) => {
                            const date = new Date(dateStr)
                            const isWeekendDay = isWeekend(date)
                            const isTodayDay = isToday(date)
                            const totalSeconds = dailyTotals.get(dateStr) ?? 0
                            const totalHours = totalSeconds / 3600

                            return (
                                <TableHead
                                    key={dateStr}
                                    className={`text-center min-w-[100px] relative ${
                                        isWeekendDay ? "bg-muted/50" : ""
                                    } ${isTodayDay ? "bg-blue-50 dark:bg-blue-950" : ""}`}
                                >
                                    {totalHours > 0 && (
                                        <div className="absolute top-0 left-0 right-0 h-0.5 flex">
                                            <div
                                                className="bg-blue-500"
                                                style={{
                                                    width: `${Math.min((totalHours / 8) * 100, 100)}%`,
                                                }}
                                            />
                                            {totalHours > 8 && (
                                                <div
                                                    className="bg-red-500"
                                                    style={{
                                                        width: `${((totalHours - 8) / 8) * 100}%`,
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}
                                    {formatDateHeader(date)}
                                </TableHead>
                            )
                        })}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={dates.length + 1} className="h-64">
                                <LoadingSpinner size="lg" />
                            </TableCell>
                        </TableRow>
                    ) : error ? (
                        <TableRow>
                            <TableCell
                                colSpan={dates.length + 1}
                                className="h-64 text-center text-destructive"
                            >
                                {error}
                            </TableCell>
                        </TableRow>
                    ) : tasksArray.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={dates.length + 1}
                                className="h-64 text-center text-muted-foreground"
                            >
                                {translations.noData}
                            </TableCell>
                        </TableRow>
                    ) : (
                        <>
                            {tasksArray.map((task) => (
                                <TableRow key={task.taskId}>
                                    <TableCell className="sticky left-0 z-10 bg-background border-r">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{task.taskTitle}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {task.listName}
                                            </span>
                                        </div>
                                    </TableCell>
                                    {dates.map((dateStr) => {
                                        const date = new Date(dateStr)
                                        const dateKey = formatDateKey(date)
                                        const durationInSeconds = task.byDate.get(dateKey)
                                        const isWeekendDay = isWeekend(date)
                                        const isTodayDay = isToday(date)

                                        return (
                                            <TableCell
                                                key={dateStr}
                                                className={`text-center tabular-nums ${
                                                    durationInSeconds
                                                        ? "cursor-pointer hover:underline hover:bg-accent"
                                                        : ""
                                                } ${isWeekendDay ? "bg-muted/50" : ""} ${
                                                    isTodayDay ? "bg-blue-50 dark:bg-blue-950" : ""
                                                }`}
                                                onClick={() => {
                                                    if (durationInSeconds) {
                                                        openTimeEntriesDialog(task.taskId)
                                                    }
                                                }}
                                            >
                                                {durationInSeconds
                                                    ? formatDuration(durationInSeconds)
                                                    : "-"}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
