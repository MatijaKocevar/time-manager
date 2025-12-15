"use client"

import { useTranslations } from "next-intl"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateTask } from "../actions/task-actions"
import { useQueryClient } from "@tanstack/react-query"
import { taskKeys } from "../query-keys"
import { TASK_STATUSES } from "../constants/task-statuses"
import { getTaskStatusLabel } from "../utils/task-status-labels"
import { useTasksStore } from "../stores/tasks-store"
import type { TaskTreeNode } from "../schemas"
import type { TaskStatus } from "../schemas/task-action-schemas"

interface TaskStatusSelectProps {
    task: TaskTreeNode
}

export function TaskStatusSelect({ task }: TaskStatusSelectProps) {
    const queryClient = useQueryClient()
    const tStatus = useTranslations("tasks.statuses")
    const setTaskOperationLoading = useTasksStore((state) => state.setTaskOperationLoading)
    const isLoading = useTasksStore(
        (state) => state.taskOperations.get(task.id)?.isLoading ?? false
    )

    const currentStatus = TASK_STATUSES.find((s) => s.value === task.status)

    const handleStatusChange = async (newStatus: TaskStatus) => {
        if (newStatus === task.status) return

        setTaskOperationLoading(task.id, true)
        try {
            const result = await updateTask({
                id: task.id,
                status: newStatus,
            })

            if (result.success) {
                await queryClient.invalidateQueries({ queryKey: taskKeys.all })
            } else {
                console.error("Failed to update task status:", result.error)
            }
        } catch (error) {
            console.error("Failed to update task status:", error)
        } finally {
            setTaskOperationLoading(task.id, false)
        }
    }

    return (
        <Select value={task.status} onValueChange={handleStatusChange} disabled={isLoading}>
            <SelectTrigger className="w-full">
                <SelectValue>
                    {currentStatus && (
                        <div
                            className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${currentStatus.color}`}
                        >
                            {getTaskStatusLabel(tStatus, currentStatus.value)}
                        </div>
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {TASK_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                        <div
                            className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${status.color}`}
                        >
                            {getTaskStatusLabel(tStatus, status.value)}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
