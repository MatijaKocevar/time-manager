"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getActiveTimer } from "../actions/task-time-actions"
import { getLists } from "../actions/list-actions"
import { useTasksStore } from "../stores/tasks-store"
import { taskKeys, listKeys } from "../query-keys"
import { CreateTaskDialog } from "./create-task-dialog"
import { DeleteTaskDialog } from "./delete-task-dialog"
import { TimeEntriesDialog } from "./time-entries-dialog"
import { CreateListDialog } from "./create-list-dialog"
import { MoveTaskDialog } from "./move-task-dialog"
import { getElapsedSeconds } from "../utils/time-helpers"

interface TasksViewClientProps {
    listId: string | null
}

export function TasksViewClient({ listId }: TasksViewClientProps) {
    const t = useTranslations("tasks.form")
    const openCreateDialog = useTasksStore((state) => state.openCreateDialog)
    const setSelectedListId = useTasksStore((state) => state.setSelectedListId)
    const activeTimers = useTasksStore((state) => state.activeTimers)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearActiveTimer = useTasksStore((state) => state.clearActiveTimer)
    const updateElapsedTime = useTasksStore((state) => state.updateElapsedTime)

    useEffect(() => {
        setSelectedListId(listId)
    }, [listId, setSelectedListId])

    const { data: lists = [] } = useQuery({
        queryKey: listKeys.all,
        queryFn: getLists,
    })

    const { data: activeTimerData } = useQuery({
        queryKey: taskKeys.activeTimer(),
        queryFn: getActiveTimer,
    })

    useEffect(() => {
        if (activeTimerData && activeTimerData.endTime === null) {
            const currentTimer = activeTimers.get(activeTimerData.taskId)

            if (!currentTimer || currentTimer.entryId !== activeTimerData.id) {
                const clearAllActiveTimers = useTasksStore.getState().clearAllActiveTimers
                clearAllActiveTimers()
                setActiveTimer(
                    activeTimerData.taskId,
                    activeTimerData.id,
                    activeTimerData.startTime
                )
            }
        } else if (!activeTimerData && activeTimers.size > 0) {
            Array.from(activeTimers.keys()).forEach((taskId) => {
                clearActiveTimer(taskId)
            })
        }
    }, [activeTimerData, activeTimers, setActiveTimer, clearActiveTimer])

    useEffect(() => {
        if (activeTimers.size === 0) return

        const interval = setInterval(() => {
            activeTimers.forEach((timer, taskId) => {
                const elapsed = getElapsedSeconds(timer.startTime)
                updateElapsedTime(taskId, elapsed)
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [activeTimers, updateElapsedTime])

    return (
        <>
            <div className="flex items-center justify-end w-full">
                <Button onClick={() => openCreateDialog()}>
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
