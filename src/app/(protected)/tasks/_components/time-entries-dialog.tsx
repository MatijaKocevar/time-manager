"use client"

import { useTranslations } from "next-intl"
import { Trash2, Square, Plus, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { MoveEntryPopover } from "@/app/(protected)/time-sheets/_components/move-entry-popover"
import { formatDuration } from "../_utils/time-helpers"
import { useTimeEntriesDialog } from "../_hooks/use-time-entries-dialog"

export function TimeEntriesDialog() {
    const t = useTranslations("tasks.form")
    const tCommon = useTranslations("common.actions")
    const tStatus = useTranslations("common.status")

    const {
        timeEntriesDialog,
        closeTimeEntriesDialog,
        currentTime,
        entries,
        childAggregation,
        isLoading,
        isSaving,
        isAddingEntry,
        newEntryStart,
        newEntryEnd,
        editedEntries,
        deleteMutation,
        stopMutation,
        totalDuration,
        saveDisabled,
        getEntryDate,
        handleFieldChange,
        handleSaveAll,
        handleDelete,
        setIsAddingEntry,
        setNewEntryStart,
        setNewEntryEnd,
        cancelNewEntry,
    } = useTimeEntriesDialog()

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
                                                        onClick={cancelNewEntry}
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
                                                                    handleDelete(
                                                                        entry.id,
                                                                        t("deleteTimeEntryConfirm")
                                                                    )
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
                                                    onClick={cancelNewEntry}
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
                                                                    handleDelete(
                                                                        entry.id,
                                                                        t("deleteTimeEntryConfirm")
                                                                    )
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
                            <Button onClick={handleSaveAll} disabled={saveDisabled}>
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
