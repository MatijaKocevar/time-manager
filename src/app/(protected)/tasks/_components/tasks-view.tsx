"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getTasks } from "../_actions/task-actions"
import { getActiveTimer } from "@/app/(protected)/shared/_actions/timer-actions"
import { getLists } from "../_actions/list-actions"
import { useTasksStore } from "../_stores/tasks-store"
import { taskKeys, listKeys } from "../query-keys"
import { TasksTable } from "./tasks-table"
import { CreateTaskDialog } from "./create-task-dialog"
import { DeleteTaskDialog } from "./delete-task-dialog"
import { TimeEntriesDialog } from "./time-entries-dialog"
import { CreateListDialog } from "./create-list-dialog"
import { MoveTaskDialog } from "./move-task-dialog"
import { getElapsedSeconds } from "../_utils/time-helpers"
import type { TaskDisplay } from "../_schemas"

interface TasksViewProps {
    initialTasks: TaskDisplay[]
    listId: string | null
}

export function TasksView({ initialTasks, listId }: TasksViewProps) {
    const t = useTranslations("tasks.form")
    const openCreateDialog = useTasksStore((state) => state.openCreateDialog)
    const selectedListId = useTasksStore((state) => state.selectedListId)
    const setSelectedListId = useTasksStore((state) => state.setSelectedListId)
    const activeTimer = useTasksStore((state) => state.activeTimer)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearActiveTimer = useTasksStore((state) => state.clearActiveTimer)
    const updateElapsedTime = useTasksStore((state) => state.updateElapsedTime)

    useEffect(() => {
        if (listId !== undefined) {
            setSelectedListId(listId)
        }
    }, [listId, setSelectedListId])

    const { data: lists = [] } = useQuery({
        queryKey: listKeys.all,
        queryFn: getLists,
        staleTime: 30000,
    })

    const { data: tasks = initialTasks } = useQuery({
        queryKey: taskKeys.byList(selectedListId ?? null),
        queryFn: () => getTasks({ listId: selectedListId ?? null }),
        initialData: initialTasks,
        staleTime: 10000,
    })

    const { data: activeTimerData } = useQuery({
        queryKey: taskKeys.activeTimer(),
        queryFn: getActiveTimer,
    })

    useEffect(() => {
        if (activeTimerData && activeTimerData.endTime === null) {
            if (
                !activeTimer ||
                activeTimer.taskId !== activeTimerData.taskId ||
                activeTimer.entryId !== activeTimerData.id ||
                activeTimer.startTime.getTime() !== activeTimerData.startTime.getTime()
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
        <div className="space-y-4">
            <div className="flex items-center justify-end w-full">
                <Button onClick={() => openCreateDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("newTask")}
                </Button>
            </div>
            <TasksTable tasks={tasks} listId={listId} lists={lists} />
            <CreateTaskDialog />
            <DeleteTaskDialog />
            <TimeEntriesDialog />
            <CreateListDialog />
            <MoveTaskDialog lists={lists} />
        </div>
    )
}
