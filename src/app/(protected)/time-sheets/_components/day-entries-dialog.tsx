"use client"

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDuration } from "@/app/(protected)/tasks/_utils/time-helpers"
import { useDayEntries } from "../_hooks/use-day-entries"
import { useTimeSheetsStore } from "../_stores/time-sheets-store"
import { useTaskDialogStore } from "@/app/(protected)/tasks/_stores/task-dialog-stores"
import type { HourType } from "@/../../prisma/generated/client"

interface DayEntry {
    id: string
    taskId: string
    startTime: Date
    endTime: Date | null
    duration: number | null
    type: string
    task: {
        title: string
    }
}

interface DayEntriesDialogProps {
    translations: {
        title: string
        description: string
        startedAt: string
        endedAt: string
        duration: string
        task: string
        active: string
        noEntries: string
        close: string
    }
}

function formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")
    return `${hours}:${minutes}:${seconds}`
}

export function DayEntriesDialog({ translations }: DayEntriesDialogProps) {
    const dayEntriesDialog = useTimeSheetsStore((state) => state.dayEntriesDialog)
    const closeDayEntriesDialog = useTimeSheetsStore((state) => state.closeDayEntriesDialog)
    const openDescriptionDialog = useTaskDialogStore((state) => state.openDescriptionDialog)
    const [currentTime, setCurrentTime] = useState(new Date())

    const { data, isLoading } = useDayEntries({
        date: dayEntriesDialog.date,
        type: dayEntriesDialog.type as HourType | null,
        enabled: dayEntriesDialog.isOpen,
    })

    const entries = (data?.data ?? []) as DayEntry[]

    useEffect(() => {
        if (!dayEntriesDialog.isOpen) {
            return
        }

        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(interval)
    }, [dayEntriesDialog.isOpen])

    const totalDuration = entries.reduce((sum, entry) => {
        if (entry.endTime === null) {
            const elapsed = Math.floor((currentTime.getTime() - entry.startTime.getTime()) / 1000)
            return sum + elapsed
        }
        return sum + (entry.duration ?? 0)
    }, 0)

    return (
        <Dialog open={dayEntriesDialog.isOpen} onOpenChange={closeDayEntriesDialog}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col gap-0 p-0 sm:p-6">
                <DialogHeader className="flex-shrink-0 pb-4 px-6 pt-6 sm:px-0 sm:pt-0">
                    <DialogTitle>{translations.title}</DialogTitle>
                    <DialogDescription>{translations.description}</DialogDescription>
                </DialogHeader>
                <div className="flex-1 min-h-0 border rounded-md relative mx-6 sm:mx-0 overflow-y-auto">
                    {isLoading && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    )}
                    {entries.length === 0 && !isLoading ? (
                        <div className="flex items-center justify-center min-h-[200px] py-12 text-muted-foreground">
                            {translations.noEntries}
                        </div>
                    ) : (
                        <>
                            <table className="hidden sm:table w-full caption-bottom text-sm">
                                <thead className="sticky top-0 bg-background z-10 border-b shadow-sm">
                                    <tr className="transition-colors">
                                        <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground bg-background">
                                            {translations.startedAt}
                                        </th>
                                        <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground bg-background">
                                            {translations.endedAt}
                                        </th>
                                        <th className="h-12 px-2 sm:px-4 align-middle font-medium text-muted-foreground text-right bg-background">
                                            {translations.duration}
                                        </th>
                                        <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground bg-background">
                                            {translations.task}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {entries.map((entry) => {
                                        const isActive = entry.endTime === null
                                        const elapsed = isActive
                                            ? Math.floor(
                                                  (currentTime.getTime() -
                                                      entry.startTime.getTime()) /
                                                      1000
                                              )
                                            : null

                                        const duration =
                                            isActive && elapsed !== null
                                                ? elapsed
                                                : (entry.duration ?? 0)

                                        return (
                                            <tr
                                                key={entry.id}
                                                className="border-b transition-colors hover:bg-muted/50"
                                            >
                                                <td className="p-2 sm:p-4 align-middle font-mono text-xs sm:text-sm">
                                                    {formatTime(entry.startTime)}
                                                </td>
                                                <td className="p-2 sm:p-4 align-middle font-mono text-xs sm:text-sm">
                                                    {isActive ? (
                                                        <span className="text-muted-foreground italic">
                                                            {translations.active}
                                                        </span>
                                                    ) : entry.endTime ? (
                                                        formatTime(entry.endTime)
                                                    ) : null}
                                                </td>
                                                <td className="p-2 sm:p-4 align-middle text-right font-mono text-xs sm:text-sm">
                                                    {formatDuration(duration)}
                                                </td>
                                                <td className="p-2 sm:p-4 align-middle text-xs sm:text-sm">
                                                    <button
                                                        type="button"
                                                        className="text-left hover:underline underline-offset-2 cursor-pointer"
                                                        onClick={() =>
                                                            openDescriptionDialog(
                                                                entry.taskId,
                                                                entry.task.title
                                                            )
                                                        }
                                                    >
                                                        {entry.task.title}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    <tr className="border-t-2 font-semibold bg-muted/30">
                                        <td
                                            colSpan={2}
                                            className="p-2 sm:p-4 align-middle text-xs sm:text-sm"
                                        >
                                            Total
                                        </td>
                                        <td className="p-2 sm:p-4 align-middle text-right font-mono text-xs sm:text-sm">
                                            {formatDuration(totalDuration)}
                                        </td>
                                        <td className="p-2 sm:p-4 align-middle"></td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="sm:hidden space-y-4 p-4">
                                {entries.map((entry) => {
                                    const isActive = entry.endTime === null
                                    const elapsed = isActive
                                        ? Math.floor(
                                              (currentTime.getTime() - entry.startTime.getTime()) /
                                                  1000
                                          )
                                        : null

                                    const duration =
                                        isActive && elapsed !== null
                                            ? elapsed
                                            : (entry.duration ?? 0)

                                    return (
                                        <div
                                            key={entry.id}
                                            className="rounded-lg border p-4 space-y-3 bg-card"
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium mb-2">
                                                        <button
                                                            type="button"
                                                            className="text-left hover:underline underline-offset-2 cursor-pointer"
                                                            onClick={() =>
                                                                openDescriptionDialog(
                                                                    entry.taskId,
                                                                    entry.task.title
                                                                )
                                                            }
                                                        >
                                                            {entry.task.title}
                                                        </button>
                                                    </div>
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">
                                                                {translations.startedAt}:
                                                            </span>
                                                            <span className="font-mono">
                                                                {formatTime(entry.startTime)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">
                                                                {translations.endedAt}:
                                                            </span>
                                                            <span className="font-mono">
                                                                {isActive ? (
                                                                    <span className="italic">
                                                                        {translations.active}
                                                                    </span>
                                                                ) : entry.endTime ? (
                                                                    formatTime(entry.endTime)
                                                                ) : null}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between font-semibold">
                                                            <span className="text-muted-foreground">
                                                                {translations.duration}:
                                                            </span>
                                                            <span className="font-mono">
                                                                {formatDuration(duration)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}

                                <div className="rounded-lg border-2 p-4 bg-muted/30">
                                    <div className="flex justify-between items-center font-semibold">
                                        <span>Total</span>
                                        <span className="font-mono">
                                            {formatDuration(totalDuration)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
