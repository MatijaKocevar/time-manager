"use client"

import { useEffect, useRef, useState } from "react"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTasksStore } from "../_stores/tasks-store"
import { useTaskDialogStore } from "../_stores/task-dialog-stores"
import {
    getTaskTimeEntries,
    updateTaskTimeEntry,
    deleteTaskTimeEntry,
    createTaskTimeEntry,
} from "../_actions/task-time-actions"
import { stopTimer } from "@/app/(protected)/shared/_actions/timer-actions"
import { taskKeys } from "../_constants/query-keys"
import { hourKeys } from "@/app/(protected)/hours/_constants/query-keys"
import { timeSheetKeys } from "@/app/(protected)/time-sheets/_constants/query-keys"
import { sharedKeys } from "@/app/(protected)/shared/_constants/query-keys"
import { trackerKeys } from "@/app/(protected)/tracker/_constants/query-keys"
import type { TaskTimeEntryDisplay } from "../_schemas/task-time-entry-schemas"

const TIME_ENTRY_PAGE_SIZE = 50

interface EditedEntry {
    id: string
    startTime: Date
    endTime: Date | null
}

export function useTimeEntriesDialog() {
    const queryClient = useQueryClient()
    const timeEntriesDialog = useTaskDialogStore((state) => state.timeEntriesDialog)
    const closeTimeEntriesDialog = useTaskDialogStore((state) => state.closeTimeEntriesDialog)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearActiveTimer = useTasksStore((state) => state.clearActiveTimer)
    const activeTimer = useTasksStore((state) => state.activeTimer)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [editedEntries, setEditedEntries] = useState<Map<string, EditedEntry>>(new Map())
    const [isSaving, setIsSaving] = useState(false)
    const [isAddingEntry, setIsAddingEntry] = useState(false)
    const [newEntryStart, setNewEntryStart] = useState<Date | undefined>(undefined)
    const [newEntryEnd, setNewEntryEnd] = useState<Date | undefined>(undefined)

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey: taskKeys.timeEntriesForTask(timeEntriesDialog.taskId ?? ""),
        queryFn: ({ pageParam }) =>
            getTaskTimeEntries(timeEntriesDialog.taskId ?? "", {
                limit: TIME_ENTRY_PAGE_SIZE,
                offset: pageParam,
            }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, _allPages, lastPageParam) =>
            lastPage.hasMore ? lastPageParam + TIME_ENTRY_PAGE_SIZE : undefined,
        enabled: timeEntriesDialog.isOpen && !!timeEntriesDialog.taskId,
    })

    const entries = data?.pages.flatMap((page) => page.entries) ?? []
    const totalCount = data?.pages[0]?.totalCount ?? 0
    const totalCompletedDuration = data?.pages[0]?.totalDuration ?? 0
    const childAggregation = data?.pages[0]?.childAggregation

    const isOpen = timeEntriesDialog.isOpen
    const prevIsOpen = useRef(isOpen)

    useEffect(() => {
        if (prevIsOpen.current && !isOpen) {
            setEditedEntries(new Map())
            setIsAddingEntry(false)
            setNewEntryStart(undefined)
            setNewEntryEnd(undefined)
        }
        prevIsOpen.current = isOpen
    }, [isOpen])

    const hasActiveEntry = entries.some((entry) => entry.endTime === null)

    useEffect(() => {
        if (!isOpen || !hasActiveEntry) return

        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(interval)
    }, [isOpen, hasActiveEntry])

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
            queryClient.invalidateQueries({ queryKey: trackerKeys.dailySummary() })

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
            queryClient.invalidateQueries({ queryKey: trackerKeys.dailySummary() })
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
            queryClient.invalidateQueries({ queryKey: trackerKeys.dailySummary() })
            queryClient.invalidateQueries({ queryKey: ["tracker", "activeTimer"] })
        },
    })

    const handleDelete = (entryId: string, confirmMessage: string) => {
        if (confirm(confirmMessage)) {
            deleteMutation.mutate({ id: entryId })
        }
    }

    const totalDuration = entries.reduce((sum, entry) => {
        if (entry.endTime === null) {
            const elapsed = Math.floor((currentTime.getTime() - entry.startTime.getTime()) / 1000)
            return sum + elapsed
        }
        return sum
    }, totalCompletedDuration)

    const saveDisabled =
        isSaving ||
        deleteMutation.isPending ||
        (editedEntries.size === 0 && (!isAddingEntry || !newEntryStart || !newEntryEnd))

    const cancelNewEntry = () => {
        setIsAddingEntry(false)
        setNewEntryStart(undefined)
        setNewEntryEnd(undefined)
    }

    return {
        timeEntriesDialog,
        closeTimeEntriesDialog,
        activeTimer,
        currentTime,
        entries,
        totalCount,
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
        hasNextPage,
        isFetchingNextPage,
        loadMore: fetchNextPage,
    }
}
