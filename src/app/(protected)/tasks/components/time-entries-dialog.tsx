"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Trash2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTasksStore } from "../stores/tasks-store"
import {
    getTaskTimeEntries,
    updateTaskTimeEntry,
    deleteTaskTimeEntry,
} from "../actions/task-time-actions"
import { taskKeys } from "../query-keys"
import { hourKeys } from "@/app/(protected)/hours/query-keys"
import { timeSheetKeys } from "@/app/(protected)/time-sheets/query-keys"
import { formatDuration } from "../utils/time-helpers"
import type { TaskTimeEntryDisplay } from "../schemas/task-time-entry-schemas"

function formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

interface EditedEntry {
    id: string
    startTime: string
    endTime: string | null
}

export function TimeEntriesDialog() {
    const t = useTranslations("tasks.form")
    const tCommon = useTranslations("common.actions")
    const queryClient = useQueryClient()
    const timeEntriesDialog = useTasksStore((state) => state.timeEntriesDialog)
    const closeTimeEntriesDialog = useTasksStore((state) => state.closeTimeEntriesDialog)
    const elapsedTimes = useTasksStore((state) => state.elapsedTimes)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const activeTimers = useTasksStore((state) => state.activeTimers)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [editedEntries, setEditedEntries] = useState<Map<string, EditedEntry>>(new Map())
    const [isSaving, setIsSaving] = useState(false)

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
            setEditedEntries(new Map())
            return
        }

        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(interval)
    }, [timeEntriesDialog.isOpen])

    const getEntryValue = (entry: TaskTimeEntryDisplay, field: "startTime" | "endTime") => {
        const edited = editedEntries.get(entry.id)
        if (edited) {
            return field === "startTime" ? edited.startTime : (edited.endTime ?? "")
        }
        if (field === "startTime") {
            return formatDateTimeLocal(entry.startTime)
        }
        return entry.endTime ? formatDateTimeLocal(entry.endTime) : ""
    }

    const handleFieldChange = (entryId: string, field: "startTime" | "endTime", value: string) => {
        const entry = entries.find((e) => e.id === entryId)
        if (!entry) return

        const edited = editedEntries.get(entryId) || {
            id: entryId,
            startTime: formatDateTimeLocal(entry.startTime),
            endTime: entry.endTime ? formatDateTimeLocal(entry.endTime) : null,
        }

        if (field === "startTime") {
            edited.startTime = value
        } else {
            edited.endTime = value || null
        }

        const newMap = new Map(editedEntries)
        newMap.set(entryId, edited)
        setEditedEntries(newMap)
    }

    const handleSaveAll = async () => {
        if (editedEntries.size === 0) return

        setIsSaving(true)
        try {
            for (const [entryId, edited] of editedEntries) {
                const entry = entries.find((e) => e.id === entryId)
                if (!entry) continue

                const result = await updateTaskTimeEntry({
                    id: edited.id,
                    startTime: new Date(edited.startTime),
                    endTime: edited.endTime ? new Date(edited.endTime) : null,
                })

                if (result.success && entry.endTime === null && entry.taskId) {
                    const currentTimer = activeTimers.get(entry.taskId)
                    if (currentTimer && currentTimer.entryId === entry.id) {
                        setActiveTimer(entry.taskId, entry.id, new Date(edited.startTime))
                    }
                }
            }

            await queryClient.invalidateQueries({ queryKey: taskKeys.all })
            await queryClient.invalidateQueries({ queryKey: hourKeys.all })
            await queryClient.invalidateQueries({ queryKey: timeSheetKeys.all })
            setEditedEntries(new Map())
        } finally {
            setIsSaving(false)
        }
    }

    const deleteMutation = useMutation({
        mutationFn: deleteTaskTimeEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
            queryClient.invalidateQueries({ queryKey: hourKeys.all })
            queryClient.invalidateQueries({ queryKey: timeSheetKeys.all })
        },
    })

    const handleDelete = (entryId: string) => {
        if (confirm(t("deleteTimeEntryConfirm"))) {
            deleteMutation.mutate({ id: entryId })
        }
    }

    const totalDuration = entries.reduce((sum, entry) => {
        if (entry.endTime === null && timeEntriesDialog.taskId) {
            const elapsed = elapsedTimes.get(timeEntriesDialog.taskId) ?? 0
            return sum + elapsed
        }
        return sum + (entry.duration ?? 0)
    }, 0)

    return (
        <Dialog open={timeEntriesDialog.isOpen} onOpenChange={closeTimeEntriesDialog}>
            <DialogContent className="!w-[95vw] !max-w-none">
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
                                        <TableHead className="w-[200px]">
                                            {t("startedAt")}
                                        </TableHead>
                                        <TableHead className="w-[200px]">{t("endedAt")}</TableHead>
                                        <TableHead className="text-right w-[120px]">
                                            {t("duration")}
                                        </TableHead>
                                        <TableHead className="w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries.map((entry) => {
                                        const isActive = entry.endTime === null
                                        const elapsed =
                                            isActive && timeEntriesDialog.taskId
                                                ? (elapsedTimes.get(timeEntriesDialog.taskId) ?? 0)
                                                : null

                                        const duration =
                                            isActive && elapsed !== null
                                                ? elapsed
                                                : (entry.duration ?? 0)

                                        return (
                                            <TableRow key={entry.id}>
                                                <TableCell className="p-2">
                                                    <Input
                                                        type="datetime-local"
                                                        value={getEntryValue(entry, "startTime")}
                                                        onChange={(e) =>
                                                            handleFieldChange(
                                                                entry.id,
                                                                "startTime",
                                                                e.target.value
                                                            )
                                                        }
                                                        disabled={
                                                            isSaving || deleteMutation.isPending
                                                        }
                                                        className="h-9 text-sm"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    {isActive ? (
                                                        <div className="flex items-center h-9 px-3 text-sm text-muted-foreground">
                                                            {formatDateTimeLocal(currentTime)}{" "}
                                                            (tracking)
                                                        </div>
                                                    ) : (
                                                        <Input
                                                            type="datetime-local"
                                                            value={getEntryValue(entry, "endTime")}
                                                            onChange={(e) =>
                                                                handleFieldChange(
                                                                    entry.id,
                                                                    "endTime",
                                                                    e.target.value
                                                                )
                                                            }
                                                            disabled={
                                                                isSaving || deleteMutation.isPending
                                                            }
                                                            className="h-9 text-sm"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatDuration(duration)}
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(entry.id)}
                                                        disabled={
                                                            isSaving || deleteMutation.isPending
                                                        }
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Total:</span>
                                <span className="text-lg font-semibold font-mono">
                                    {formatDuration(totalDuration)}
                                </span>
                            </div>
                            {editedEntries.size > 0 && (
                                <Button
                                    onClick={handleSaveAll}
                                    disabled={isSaving || deleteMutation.isPending}
                                >
                                    {isSaving ? tCommon("saving") : tCommon("save")}{" "}
                                    {editedEntries.size > 1 && `(${editedEntries.size})`}
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
