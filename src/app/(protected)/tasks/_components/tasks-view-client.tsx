"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getActiveTimer } from "@/app/(protected)/shared/_actions/timer-actions"
import { getLists } from "../_actions/list-actions"
import { useTasksStore } from "../_stores/tasks-store"
import { useTaskDialogStore } from "../_stores/task-dialog-stores"
import { taskKeys, listKeys } from "../_constants/query-keys"
import { CreateTaskDialog } from "./create-task-dialog"
import { DeleteTaskDialog } from "./delete-task-dialog"
import { TimeEntriesDialog } from "./time-entries-dialog"
import { CreateListDialog } from "./create-list-dialog"
import { MoveTaskDialog } from "./move-task-dialog"
import { getElapsedSeconds } from "../_utils/time-helpers"
import { useTasksSSE } from "../_hooks/use-tasks-sse"
import { useTasksPusher } from "../_hooks/use-tasks-pusher"

interface TasksViewClientProps {
    listId: string | null
}

export function TasksViewClient({ listId }: TasksViewClientProps) {
    const t = useTranslations("tasks.form")
    useTasksSSE()
    useTasksPusher()
    const openCreateDialog = useTaskDialogStore((state) => state.openCreateDialog)
    const setSelectedListId = useTasksStore((state) => state.setSelectedListId)
    const activeTimer = useTasksStore((state) => state.activeTimer)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearActiveTimer = useTasksStore((state) => state.clearActiveTimer)
    const updateElapsedTime = useTasksStore((state) => state.updateElapsedTime)

    useEffect(() => {
        setSelectedListId(listId)
    }, [listId, setSelectedListId])

    const { data: lists = [] } = useQuery({
        queryKey: listKeys.all,
        queryFn: getLists,
        staleTime: 30000,
    })

    const { data: activeTimerData } = useQuery({
        queryKey: taskKeys.activeTimer(),
        queryFn: getActiveTimer,
        staleTime: 5000,
    })

    useEffect(() => {
        if (activeTimerData && activeTimerData.endTime === null) {
            if (
                !activeTimer ||
                activeTimer.taskId !== activeTimerData.taskId ||
                activeTimer.entryId !== activeTimerData.id
            ) {
                clearActiveTimer()
                setActiveTimer(
                    activeTimerData.taskId,
                    activeTimerData.id,
                    activeTimerData.startTime
                )
            }
        } else if (!activeTimerData && activeTimer) {
            clearActiveTimer()
        }
    }, [activeTimerData, activeTimer, setActiveTimer, clearActiveTimer])

    useEffect(() => {
        if (!activeTimer) return

        const interval = setInterval(() => {
            const elapsed = getElapsedSeconds(activeTimer.startTime)
            updateElapsedTime(elapsed)
        }, 1000)

        return () => clearInterval(interval)
    }, [activeTimer, updateElapsedTime])

    return (
        <>
            <div className="flex items-center justify-end w-full">
                <Button id="tasks-list-new-task" onClick={() => openCreateDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("newTask")}
                </Button>
            </div>
            <CreateTaskDialog />
            <DeleteTaskDialog />
            <TimeEntriesDialog />
            <CreateListDialog />
            <MoveTaskDialog lists={lists} />
        </>
    )
}
