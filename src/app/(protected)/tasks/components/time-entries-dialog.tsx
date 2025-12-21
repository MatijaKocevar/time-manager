"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useTasksStore } from "../stores/tasks-store"
import { getTaskTimeEntries } from "../actions/task-time-actions"
import { taskKeys } from "../query-keys"
import { formatDateTime, formatDuration } from "../utils/time-helpers"

export function TimeEntriesDialog() {
    const t = useTranslations("tasks.form")
    const timeEntriesDialog = useTasksStore((state) => state.timeEntriesDialog)
    const closeTimeEntriesDialog = useTasksStore((state) => state.closeTimeEntriesDialog)

    const { data: entries = [] } = useQuery({
        queryKey: taskKeys.timeEntriesForTask(timeEntriesDialog.taskId ?? ""),
        queryFn: () => {
            if (!timeEntriesDialog.taskId) return []
            return getTaskTimeEntries(timeEntriesDialog.taskId)
        },
        enabled: timeEntriesDialog.isOpen && !!timeEntriesDialog.taskId,
    })

    useEffect(() => {
        if (!timeEntriesDialog.isOpen) {
            return
        }
    }, [timeEntriesDialog.isOpen])

    const totalDuration = entries.reduce((sum, entry) => sum + (entry.duration ?? 0), 0)

    return (
        <Dialog open={timeEntriesDialog.isOpen} onOpenChange={closeTimeEntriesDialog}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{t("timeEntries")}</DialogTitle>
                    <DialogDescription>{t("noTimeEntries")}</DialogDescription>
                </DialogHeader>

                {entries.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                        {t("noTimeEntries")}
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("startedAt")}</TableHead>
                                        <TableHead>{t("endedAt")}</TableHead>
                                        <TableHead className="text-right">
                                            {t("duration")}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>{formatDateTime(entry.startTime)}</TableCell>
                                            <TableCell>
                                                {entry.endTime
                                                    ? formatDateTime(entry.endTime)
                                                    : "Running..."}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {entry.duration
                                                    ? formatDuration(entry.duration)
                                                    : "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-end items-center gap-2 pt-4 border-t">
                            <span className="text-sm text-muted-foreground">Total:</span>
                            <span className="text-lg font-semibold font-mono">
                                {formatDuration(totalDuration)}
                            </span>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
