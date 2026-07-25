"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Trash2, Square, Plus, X } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { useTasksStore } from "../stores/tasks-store"
import {
    getTaskTimeEntries,
    updateTaskTimeEntry,
    deleteTaskTimeEntry,
    createTaskTimeEntry,
} from "../actions/task-time-actions"
import { stopTimer } from "@/app/(protected)/shared/actions/timer-actions"
import { taskKeys } from "../query-keys"
import { hourKeys } from "@/app/(protected)/hours/query-keys"
import { timeSheetKeys } from "@/app/(protected)/time-sheets/query-keys"
import { sharedKeys } from "@/app/(protected)/shared/query-keys"
import { formatDuration } from "../utils/time-helpers"
import { MoveEntryPopover } from "@/app/(protected)/time-sheets/components/move-entry-popover"
import type { TaskTimeEntryDisplay } from "../schemas/task-time-entry-schemas"

interface EditedEntry {
    id: string
    startTime: Date
    endTime: Date | null
}

export function TimeEntriesDialog() {
    const t = useTranslations("tasks.form")
    const tCommon = useTranslations("common.actions")
    const tStatus = useTranslations("common.status")
    const queryClient = useQueryClient()
    const timeEntriesDialog = useTasksStore((state) => state.timeEntriesDialog)
    const closeTimeEntriesDialog = useTasksStore((state) => state.closeTimeEntriesDialog)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearActiveTimer = useTasksStore((state) => state.clearActiveTimer)
    const activeTimer = useTasksStore((state) => state.activeTimer)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [editedEntries, setEditedEntries] = useState<Map<string, EditedEntry>>(new Map())
    const [isSaving, setIsSaving] = useState(false)
    const [isAddingEntry, setIsAddingEntry] = useState(false)
    const [newEntryStart, setNewEntryStart] = useState<Date | undefined>(undefined)
    const [newEntryEnd, setNewEntryEnd] = useState<Date | undefined>(undefined)

    const { data, isLoading } = useQuery({
        queryKey: taskKeys.timeEntriesForTask(timeEntriesDialog.taskId ?? ""),
        queryFn: () => {
            if (!timeEntriesDialog.taskId) return { entries: [], childAggregation: null }
            return getTaskTimeEntries(timeEntriesDialog.taskId)
        },
        enabled: timeEntriesDialog.isOpen && !!timeEntriesDialog.taskId,
    })

    const entries = data?.entries ?? []
    const childAggregation = data?.childAggregation

    useEffect(() => {
        if (!timeEntriesDialog.isOpen) {
            setEditedEntries(new Map())
            setIsAddingEntry(false)
            setNewEntryStart(undefined)
            setNewEntryEnd(undefined)
            return
        }

        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(interval)
    }, [timeEntriesDialog.isOpen])

    const getEntryDate = (
        entry: TaskTimeEntryDisplay,
        field: "startTime" | "endTime"
    ): Date | undefined => {
        const edited = editedEntries.get(entry.id)
        if (edited) {
            return field === "startTime" ? edited.startTime : (edited.endTime ?? undefined)
        }
        if (field === "startTime") {
            return entry.startTime
        }
        return entry.endTime ?? undefined
    }

    const handleFieldChange = (
        entryId: string,
        field: "startTime" | "endTime",
        date: Date | undefined
    ) => {
        const entry = entries.find((e) => e.id === entryId)
        if (!entry || !date) return

        const edited = editedEntries.get(entryId) || {
            id: entryId,
            startTime: entry.startTime,
            endTime: entry.endTime,
        }

        if (field === "startTime") {
            edited.startTime = date
        } else {
            edited.endTime = date
        }

        const newMap = new Map(editedEntries)
        newMap.set(entryId, edited)
        setEditedEntries(newMap)
    }

    const handleSaveAll = async () => {
        setIsSaving(true)
        try {
            if (isAddingEntry && newEntryStart && newEntryEnd && timeEntriesDialog.taskId) {
                const createResult = await createTaskTimeEntry({
                    taskId: timeEntriesDialog.taskId,
                    startTime: newEntryStart,
                    endTime: newEntryEnd,
                })
                if (!createResult.error) {
                    setIsAddingEntry(false)
                    setNewEntryStart(undefined)
                    setNewEntryEnd(undefined)
                }
            }
            for (const [entryId, edited] of editedEntries) {
                const entry = entries.find((e) => e.id === entryId)
                if (!entry) continue

                const result = await updateTaskTimeEntry({
                    id: edited.id,
                    startTime: edited.startTime,
                    endTime: edited.endTime,
                })

                if (result.error) {
                    alert(`Failed to update entry: ${result.error}`)
                    continue
                }

                if (entry.endTime === null && entry.taskId) {
                    setActiveTimer(entry.taskId, entry.id, edited.startTime)
                }
            }

            queryClient.invalidateQueries({ queryKey: sharedKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
            queryClient.invalidateQueries({ queryKey: hourKeys.all })
            queryClient.invalidateQueries({ queryKey: timeSheetKeys.all })
            queryClient.invalidateQueries({ queryKey: ["tracker", "dailySummary"] })

            setEditedEntries(new Map())
        } finally {
            setIsSaving(false)
        }
    }

    const deleteMutation = useMutation({
        mutationFn: deleteTaskTimeEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
            queryClient.invalidateQueries({ queryKey: hourKeys.all })
            queryClient.invalidateQueries({ queryKey: timeSheetKeys.all })
            queryClient.invalidateQueries({ queryKey: ["tracker", "dailySummary"] })
            queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
        },
    })

    const stopMutation = useMutation({
        mutationFn: stopTimer,
        onSuccess: () => {
            clearActiveTimer()
            queryClient.invalidateQueries({ queryKey: taskKeys.activeTimer() })
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
            queryClient.invalidateQueries({ queryKey: hourKeys.all })
            queryClient.invalidateQueries({ queryKey: timeSheetKeys.all })
            queryClient.invalidateQueries({ queryKey: ["tracker", "dailySummary"] })
            queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
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
            <DialogContent className="w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[85vh] flex flex-col gap-0 p-0 sm:p-6">
                <DialogHeader className="flex-shrink-0 pb-4 px-4 pt-4 sm:px-0 sm:pt-0">
                    <DialogTitle>{t("timeEntries")}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col flex-1 min-h-0 gap-4 px-4 sm:px-0">
                    <div className="rounded-md border relative flex-1 min-h-0 overflow-y-auto">
                        {isLoading && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                                <LoadingSpinner />
                            </div>
                        )}
                        {entries.length === 0 &&
                        !childAggregation &&
                        !isLoading &&
                        !isAddingEntry ? (
                            <div className="flex items-center justify-center min-h-[200px] py-12 text-muted-foreground">
                                {t("noTimeEntries")}
                            </div>
                        ) : (
                            <div>
                                {/* Desktop table view */}
                                <table className="hidden sm:table w-full caption-bottom text-sm">
                                    <thead className="sticky top-0 bg-background z-10 [&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground bg-background">
                                                {t("startedAt")}
                                            </th>
                                            <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground bg-background">
                                                {t("endedAt")}
                                            </th>
                                            <th className="h-12 px-2 sm:px-4 align-middle font-medium text-muted-foreground bg-background w-10"></th>
                                            <th className="h-12 px-2 sm:px-4 align-middle font-medium text-muted-foreground text-right bg-background">
                                                {t("duration")}
                                            </th>
                                            <th className="h-12 px-2 sm:px-4 align-middle font-medium text-muted-foreground bg-background"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {isAddingEntry && (
                                            <tr className="border-b bg-muted/10">
                                                <td className="p-2 sm:p-4 align-middle">
                                                    <DateTimePicker
                                                        value={newEntryStart}
                                                        onChange={setNewEntryStart}
                                                        modal={true}
                                                        hideTime={false}
                                                        timePicker={{
                                                            hour: true,
                                                            minute: true,
                                                            second: false,
                                                        }}
                                                        timezone="Europe/Ljubljana"
                                                    />
                                                </td>
                                                <td className="p-2 sm:p-4 align-middle">
                                                    <DateTimePicker
                                                        value={newEntryEnd}
                                                        onChange={setNewEntryEnd}
                                                        modal={true}
                                                        hideTime={false}
                                                        timePicker={{
                                                            hour: true,
                                                            minute: true,
                                                            second: false,
                                                        }}
                                                        timezone="Europe/Ljubljana"
                                                    />
                                                </td>
                                                <td className="p-2 sm:p-4 align-middle"></td>
                                                <td className="p-2 sm:p-4 align-middle text-right font-mono text-xs sm:text-sm">
                                                    {newEntryStart &&
                                                    newEntryEnd &&
                                                    newEntryEnd > newEntryStart
                                                        ? formatDuration(
                                                              Math.floor(
                                                                  (newEntryEnd.getTime() -
                                                                      newEntryStart.getTime()) /
                                                                      1000
                                                              )
                                                          )
                                                        : "—"}
                                                </td>
                                                <td className="p-2 sm:p-4 align-middle">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setIsAddingEntry(false)
                                                            setNewEntryStart(undefined)
                                                            setNewEntryEnd(undefined)
                                                        }}
                                                        className="h-8 w-8 p-0"
                                                        aria-label="Cancel"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        )}
                                        {childAggregation && (
                                            <tr className="border-b bg-muted/30">
                                                <td
                                                    colSpan={3}
                                                    className="p-2 sm:p-4 align-middle text-muted-foreground italic text-xs sm:text-sm"
                                                >
                                                    {t("childTimeAggregation")}
                                                </td>
                                                <td className="p-2 sm:p-4 align-middle text-right font-mono text-muted-foreground text-xs sm:text-sm">
                                                    {formatDuration(
                                                        childAggregation.aggregatedDuration
                                                    )}
                                                </td>
                                                <td className="p-2 sm:p-4 align-middle"></td>
                                            </tr>
                                        )}
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
                                                    <td className="p-2 sm:p-4 align-middle">
                                                        <DateTimePicker
                                                            value={getEntryDate(entry, "startTime")}
                                                            onChange={(date: Date | undefined) =>
                                                                handleFieldChange(
                                                                    entry.id,
                                                                    "startTime",
                                                                    date
                                                                )
                                                            }
                                                            disabled={
                                                                isSaving || deleteMutation.isPending
                                                            }
                                                            modal={true}
                                                            hideTime={false}
                                                            timePicker={{
                                                                hour: true,
                                                                minute: true,
                                                                second: false,
                                                            }}
                                                            timezone="Europe/Ljubljana"
                                                        />
                                                    </td>
                                                    <td className="p-2 sm:p-4 align-middle">
                                                        {isActive ? (
                                                            <div className="flex items-center h-9 px-3 text-xs sm:text-sm text-muted-foreground">
                                                                {t("now")}
                                                            </div>
                                                        ) : (
                                                            <DateTimePicker
                                                                value={getEntryDate(
                                                                    entry,
                                                                    "endTime"
                                                                )}
                                                                onChange={(
                                                                    date: Date | undefined
                                                                ) =>
                                                                    handleFieldChange(
                                                                        entry.id,
                                                                        "endTime",
                                                                        date
                                                                    )
                                                                }
                                                                disabled={
                                                                    isSaving ||
                                                                    deleteMutation.isPending
                                                                }
                                                                modal={true}
                                                                hideTime={false}
                                                                timePicker={{
                                                                    hour: true,
                                                                    minute: true,
                                                                    second: false,
                                                                }}
                                                                timezone="Europe/Ljubljana"
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-2 sm:p-4 align-middle">
                                                        <MoveEntryPopover
                                                            entryId={entry.id}
                                                            currentTaskId={entry.taskId}
                                                            translations={{
                                                                moveEntry: t("moveEntry"),
                                                                searchTasks: t("searchTasks"),
                                                                noTasksFound: t("noTasksFound"),
                                                                moveSuccess: t("moveSuccess"),
                                                                moveError: t("moveError"),
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="p-2 sm:p-4 align-middle text-right font-mono text-xs sm:text-sm">
                                                        {formatDuration(duration)}
                                                    </td>
                                                    <td className="p-2 sm:p-4 align-middle">
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
                                                                aria-label="Stop"
                                                            >
                                                                <Square className="h-4 w-4" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleDelete(entry.id)
                                                                }
                                                                disabled={
                                                                    isSaving ||
                                                                    deleteMutation.isPending
                                                                }
                                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                aria-label="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>

                                {/* Mobile card view */}
                                <div className="sm:hidden space-y-3 p-3">
                                    {isAddingEntry && (
                                        <div className="rounded-lg border bg-muted/10 p-3 space-y-3">
                                            <div className="space-y-2">
                                                <div className="text-xs font-medium text-muted-foreground">
                                                    {t("startedAt")}
                                                </div>
                                                <DateTimePicker
                                                    value={newEntryStart}
                                                    onChange={setNewEntryStart}
                                                    modal={true}
                                                    hideTime={false}
                                                    timePicker={{
                                                        hour: true,
                                                        minute: true,
                                                        second: false,
                                                    }}
                                                    timezone="Europe/Ljubljana"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-xs font-medium text-muted-foreground">
                                                    {t("endedAt")}
                                                </div>
                                                <DateTimePicker
                                                    value={newEntryEnd}
                                                    onChange={setNewEntryEnd}
                                                    modal={true}
                                                    hideTime={false}
                                                    timePicker={{
                                                        hour: true,
                                                        minute: true,
                                                        second: false,
                                                    }}
                                                    timezone="Europe/Ljubljana"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <div className="space-y-1">
                                                    <div className="text-xs text-muted-foreground">
                                                        {t("duration")}
                                                    </div>
                                                    <div className="text-sm font-mono font-semibold">
                                                        {newEntryStart &&
                                                        newEntryEnd &&
                                                        newEntryEnd > newEntryStart
                                                            ? formatDuration(
                                                                  Math.floor(
                                                                      (newEntryEnd.getTime() -
                                                                          newEntryStart.getTime()) /
                                                                          1000
                                                                  )
                                                              )
                                                            : "—"}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setIsAddingEntry(false)
                                                        setNewEntryStart(undefined)
                                                        setNewEntryEnd(undefined)
                                                    }}
                                                    className="h-8 w-8 p-0"
                                                    aria-label="Cancel"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    {childAggregation && (
                                        <div className="rounded-lg border bg-muted/30 p-3">
                                            <div className="text-xs text-muted-foreground italic mb-1">
                                                {t("childTimeAggregation")}
                                            </div>
                                            <div className="text-sm font-mono text-muted-foreground">
                                                {formatDuration(
                                                    childAggregation.aggregatedDuration
                                                )}
                                            </div>
                                        </div>
                                    )}
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
                                            <div
                                                key={entry.id}
                                                className="rounded-lg border bg-card p-3 space-y-3"
                                            >
                                                <div className="space-y-2">
                                                    <div className="text-xs font-medium text-muted-foreground">
                                                        {t("startedAt")}
                                                    </div>
                                                    <DateTimePicker
                                                        value={getEntryDate(entry, "startTime")}
                                                        onChange={(date: Date | undefined) =>
                                                            handleFieldChange(
                                                                entry.id,
                                                                "startTime",
                                                                date
                                                            )
                                                        }
                                                        disabled={
                                                            isSaving || deleteMutation.isPending
                                                        }
                                                        modal={true}
                                                        hideTime={false}
                                                        timePicker={{
                                                            hour: true,
                                                            minute: true,
                                                            second: false,
                                                        }}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="text-xs font-medium text-muted-foreground">
                                                        {t("endedAt")}
                                                    </div>
                                                    {isActive ? (
                                                        <div className="flex items-center h-9 px-3 text-xs text-muted-foreground border rounded-md">
                                                            {t("now")}
                                                        </div>
                                                    ) : (
                                                        <DateTimePicker
                                                            value={getEntryDate(entry, "endTime")}
                                                            onChange={(date: Date | undefined) =>
                                                                handleFieldChange(
                                                                    entry.id,
                                                                    "endTime",
                                                                    date
                                                                )
                                                            }
                                                            disabled={
                                                                isSaving || deleteMutation.isPending
                                                            }
                                                            modal={true}
                                                            hideTime={false}
                                                            timePicker={{
                                                                hour: true,
                                                                minute: true,
                                                                second: false,
                                                            }}
                                                        />
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between pt-2 border-t">
                                                    <div className="space-y-1">
                                                        <div className="text-xs text-muted-foreground">
                                                            {t("duration")}
                                                        </div>
                                                        <div className="text-sm font-mono font-semibold">
                                                            {formatDuration(duration)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MoveEntryPopover
                                                            entryId={entry.id}
                                                            currentTaskId={entry.taskId}
                                                            translations={{
                                                                moveEntry: t("moveEntry"),
                                                                searchTasks: t("searchTasks"),
                                                                noTasksFound: t("noTasksFound"),
                                                                moveSuccess: t("moveSuccess"),
                                                                moveError: t("moveError"),
                                                            }}
                                                        />
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
                                                                aria-label="Stop"
                                                            >
                                                                <Square className="h-4 w-4" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleDelete(entry.id)
                                                                }
                                                                disabled={
                                                                    isSaving ||
                                                                    deleteMutation.isPending
                                                                }
                                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                aria-label="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex-shrink-0 flex justify-between items-center pt-4 pb-4 sm:pb-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Total:</span>
                            <span className="text-lg font-semibold font-mono">
                                {formatDuration(totalDuration)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAddingEntry(true)}
                                disabled={isAddingEntry || isSaving || deleteMutation.isPending}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                {t("addEntry")}
                            </Button>
                            <Button
                                onClick={handleSaveAll}
                                disabled={
                                    isSaving ||
                                    deleteMutation.isPending ||
                                    (editedEntries.size === 0 &&
                                        (!isAddingEntry || !newEntryStart || !newEntryEnd))
                                }
                            >
                                {isSaving ? tStatus("saving") : tCommon("save")}{" "}
                                {editedEntries.size > 1 && `(${editedEntries.size})`}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
