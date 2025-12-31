"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTasksStore } from "../stores/tasks-store"
import { getActiveTimer } from "../actions/task-time-actions"
import { getLists } from "../actions/list-actions"
import { taskKeys, listKeys } from "../query-keys"
import { getElapsedSeconds } from "../utils/time-helpers"
import { TasksFlatTable } from "./tasks-flat-table"
import { CreateTaskDialog } from "./create-task-dialog"
import { DeleteTaskDialog } from "./delete-task-dialog"
import { TimeEntriesDialog } from "./time-entries-dialog"
import { CreateListDialog } from "./create-list-dialog"
import { MoveTaskDialog } from "./move-task-dialog"
import { OverviewNewTaskButton } from "./overview-new-task-button"
import type { TaskDisplay } from "../schemas"
import type { ListDisplay } from "../schemas/list-schemas"

interface TaskGroup {
    listId: string | null
    listName: string
    listColor: string | null
    listIcon: string | null
    tasks: TaskDisplay[]
}

interface TasksOverviewClientProps {
    groups: TaskGroup[]
    lists: ListDisplay[]
}

export function TasksOverviewClient({ groups, lists: initialLists }: TasksOverviewClientProps) {
    const activeTimers = useTasksStore((state) => state.activeTimers)
    const setActiveTimer = useTasksStore((state) => state.setActiveTimer)
    const clearActiveTimer = useTasksStore((state) => state.clearActiveTimer)
    const updateElapsedTime = useTasksStore((state) => state.updateElapsedTime)

    const { data: lists = initialLists } = useQuery({
        queryKey: listKeys.all,
        queryFn: getLists,
        initialData: initialLists,
        staleTime: 30000,
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
        <div className="space-y-8">
            {groups.map((group) => {
                return (
                    <div key={group.listId ?? "no-list"} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {group.listColor && (
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: group.listColor }}
                                    />
                                )}
                                <h2 className="text-xl font-semibold">{group.listName}</h2>
                                <span className="text-sm text-muted-foreground">
                                    ({group.tasks.length}{" "}
                                    {group.tasks.length === 1 ? "task" : "tasks"})
                                </span>
                            </div>
                            <OverviewNewTaskButton listId={group.listId} />
                        </div>
                        <TasksFlatTable tasks={group.tasks} lists={lists} />
                    </div>
                )
            })}

            <CreateTaskDialog />
            <DeleteTaskDialog />
            <TimeEntriesDialog />
            <CreateListDialog />
            <MoveTaskDialog lists={lists} />
        </div>
    )
}
