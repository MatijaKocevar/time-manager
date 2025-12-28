"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getTasks } from "../actions/task-actions"
import { getActiveTimer } from "../actions/task-time-actions"
import { getLists } from "../actions/list-actions"
import { useTasksStore } from "../stores/tasks-store"
import { taskKeys, listKeys } from "../query-keys"
import { TasksTable } from "./tasks-table"
import { CreateTaskDialog } from "./create-task-dialog"
import { DeleteTaskDialog } from "./delete-task-dialog"
import { TimeEntriesDialog } from "./time-entries-dialog"
import { CreateListDialog } from "./create-list-dialog"
import { MoveTaskDialog } from "./move-task-dialog"
import { getElapsedSeconds } from "../utils/time-helpers"
import type { TaskDisplay } from "../schemas"

interface TasksViewProps {
    initialTasks: TaskDisplay[]
    listId: string | null
}

export function TasksView({ initialTasks, listId }: TasksViewProps) {
    const t = useTranslations("tasks.form")
    const openCreateDialog = useTasksStore((state) => state.openCreateDialog)
    const selectedListId = useTasksStore((state) => state.selectedListId)
    const setSelectedListId = useTasksStore((state) => state.setSelectedListId)
    const activeTimers = useTasksStore((state) => state.activeTimers)
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
        staleTime: 5000,
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
