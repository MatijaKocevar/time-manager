"use client"

import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react"
import { Fragment, useState } from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { useTasksStore } from "../stores/tasks-store"
import { toggleTaskExpanded } from "../actions/task-actions"
import { taskKeys } from "../query-keys"
import { EditableTaskTitle } from "./editable-task-title"
import { TaskStatusSelect } from "./task-status-select"
import { TaskTimeTracker } from "./task-time-tracker"
import type { TaskTreeNode } from "../schemas"

interface TaskRowProps {
    task: TaskTreeNode
}

export function TaskRow({ task }: TaskRowProps) {
    const [isToggling, setIsToggling] = useState(false)
    const queryClient = useQueryClient()
    const openDeleteDialog = useTasksStore((state) => state.openDeleteDialog)
    const openCreateDialog = useTasksStore((state) => state.openCreateDialog)

    const isExpanded = task.isExpanded
    const hasSubtasks = task.subtasks && task.subtasks.length > 0

    const handleToggleExpand = async () => {
        if (!hasSubtasks || isToggling) return

        setIsToggling(true)
        try {
            const result = await toggleTaskExpanded({ id: task.id, isExpanded: !isExpanded })

            if (result.success) {
                await queryClient.invalidateQueries({ queryKey: taskKeys.all })
            } else {
                console.error("Failed to toggle task expansion:", result.error)
            }
        } catch (error) {
            console.error("Failed to toggle task expansion:", error)
        } finally {
            setIsToggling(false)
        }
    }

    const handleAddSubtask = () => {
        openCreateDialog(task.id)
    }

    const handleDelete = () => {
        openDeleteDialog(task.id)
    }

    return (
        <>
            <TableRow className="hover:bg-muted/50">
                <TableCell>
                    {hasSubtasks ? (
                        <button
                            onClick={handleToggleExpand}
                            disabled={isToggling}
                            className="p-1 hover:bg-muted rounded disabled:opacity-50"
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>
                    ) : null}
                </TableCell>
                <TableCell>
                    <div style={{ paddingLeft: `${task.depth * 24}px` }}>
                        <EditableTaskTitle task={task} />
                        {task.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                                {task.description}
                            </div>
                        )}
                    </div>
                </TableCell>
                <TableCell>
                    <TaskStatusSelect task={task} />
                </TableCell>
                <TableCell>
                    <TaskTimeTracker task={task} />
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAddSubtask}
                            className="h-8 w-8 p-0"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Add subtask</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            className="h-8 w-8 p-0 text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete task</span>
                        </Button>
                    </div>
                </TableCell>
            </TableRow>

            {isExpanded &&
                hasSubtasks &&
                task.subtasks.map((subtask) => (
                    <Fragment key={subtask.id}>
                        <TaskRow task={subtask} />
                    </Fragment>
                ))}
        </>
    )
}
