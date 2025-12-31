"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Trash2, Square } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTasksStore } from "../stores/tasks-store"
import {
    getTaskTimeEntries,
    updateTaskTimeEntry,
    deleteTaskTimeEntry,
    stopTimer,
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
    const tStatus = useTranslations("common.status")
    const queryClient = useQueryClient()
    const timeEntriesDialog = useTasksStore((state) => state.timeEntriesDialog)
    const closeTimeEntriesDialog = useTasksStore((state) => state.closeTimeEntriesDialog)
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

    const stopMutation = useMutation({
        mutationFn: stopTimer,
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
        if (entry.endTime === null) {
            const elapsed = Math.floor((currentTime.getTime() - entry.startTime.getTime()) / 1000)
            return sum + elapsed
        }
        return sum + (entry.duration ?? 0)
    }, 0)

    return (
        <Dialog open={timeEntriesDialog.isOpen} onOpenChange={closeTimeEntriesDialog}>
            <DialogContent className="!w-[95vw] !max-w-none max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t("timeEntries")}</DialogTitle>
                    <DialogDescription>{t("noTimeEntries")}</DialogDescription>
                </DialogHeader>

                {entries.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                        {t("noTimeEntries")}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="rounded-md border overflow-y-auto max-h-[60vh]">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="sticky top-0 bg-background z-10 [&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[200px] bg-background">
                                            {t("startedAt")}
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[200px] bg-background">
                                            {t("endedAt")}
                                        </th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right w-[120px] bg-background">
                                            {t("duration")}
                                        </th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[60px] bg-background"></th>
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
                                                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                            >
                                                <td className="p-4 align-middle">
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
                                                </td>
                                                <td className="p-4 align-middle">
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
                                                </td>
                                                <td className="p-4 align-middle text-right font-mono">
                                                    {formatDuration(duration)}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {isActive ? (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => {
                                                                stopMutation.mutate({
                                                                    id: entry.id,
                                                                })
                                                            }}
                                                            disabled={stopMutation.isPending}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Square className="h-4 w-4" />
                                                            <span className="sr-only">Stop</span>
                                                        </Button>
                                                    ) : (
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
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center pt-4">
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
                                    {isSaving ? tStatus("saving") : tCommon("save")}{" "}
                                    {editedEntries.size > 1 && `(${editedEntries.size})`}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
