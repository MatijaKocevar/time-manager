"use client"

import { useTranslations } from "next-intl"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateTask } from "../_actions/task-actions"
import { useQueryClient } from "@tanstack/react-query"
import { taskKeys } from "../_constants/query-keys"
import { TASK_STATUSES } from "../_constants/task-statuses"
import { getTaskStatusLabel } from "../_utils/task-status-labels"
import { useTasksStore } from "../_stores/tasks-store"
import type { TaskTreeNode } from "../_schemas"
import type { TaskStatus } from "../_schemas/task-action-schemas"

interface TaskStatusSelectProps {
    task: TaskTreeNode
    onSuccess?: () => void
}

export function TaskStatusSelect({ task, onSuccess }: TaskStatusSelectProps) {
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
                onSuccess?.()
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
