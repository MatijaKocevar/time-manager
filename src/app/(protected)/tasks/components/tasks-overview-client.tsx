"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTasksStore } from "../stores/tasks-store"
import { getActiveTimer } from "@/app/(protected)/shared/actions/timer-actions"
import { getLists } from "../actions/list-actions"
import { taskKeys, listKeys } from "../query-keys"
import { getElapsedSeconds } from "../utils/time-helpers"
import { useTasksSSE } from "../hooks/use-tasks-sse"
import { useTasksPusher } from "../hooks/use-tasks-pusher"
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
    useTasksSSE()
    useTasksPusher()
    const activeTimer = useTasksStore((state) => state.activeTimer)
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
        <div className="space-y-8">
            {groups.map((group) => {
                return (
                    <div key={group.listId ?? "no-list"} className="tasks-overview-group space-y-3">
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
