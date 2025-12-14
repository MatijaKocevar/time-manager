"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, ChevronDown } from "lucide-react"
import { buildTaskTree } from "@/app/(protected)/tasks/utils/task-tree-helpers"
import { toggleTaskExpanded } from "@/app/(protected)/tasks/actions/task-actions"
import { useQueryClient } from "@tanstack/react-query"
import { taskKeys } from "@/app/(protected)/tasks/query-keys"
import { TaskTimeTracker } from "@/app/(protected)/tasks/components/task-time-tracker"
import type { TaskDisplay, TaskTreeNode } from "@/app/(protected)/tasks/schemas/task-schemas"

interface TrackerTasksTableProps {
    tasks: TaskDisplay[]
}

function TaskTreeRow({ task }: { task: TaskTreeNode }) {
    const queryClient = useQueryClient()
    const isExpanded = task.isExpanded
    const hasSubtasks = task.subtasks.length > 0

    const handleToggleExpand = async () => {
        if (!hasSubtasks) return

        try {
            const result = await toggleTaskExpanded({ id: task.id, isExpanded: !isExpanded })

            if (result.success) {
                await queryClient.invalidateQueries({ queryKey: taskKeys.all })
            }
        } catch (error) {
            console.error("Failed to toggle task expansion:", error)
        }
    }

    return (
        <>
            <TableRow>
                <TableCell className="w-12">
                    {hasSubtasks && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={handleToggleExpand}
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                </TableCell>
                <TableCell>
                    <div
                        style={{ paddingLeft: `${task.depth * 24}px` }}
                        className="flex items-center gap-2"
                    >
                        <span className="font-medium">{task.title}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant="secondary">{task.status}</Badge>
                </TableCell>
                <TableCell>
                    {task.listName && (
                        <Badge
                            variant="outline"
                            style={{
                                borderColor: task.listColor ?? undefined,
                                color: task.listColor ?? undefined,
                            }}
                        >
                            {task.listIcon && <span className="mr-1">{task.listIcon}</span>}
                            {task.listName}
                        </Badge>
                    )}
                </TableCell>
                <TableCell>
                    <TaskTimeTracker task={task} />
                </TableCell>
            </TableRow>
            {isExpanded &&
                task.subtasks.map((subtask) => <TaskTreeRow key={subtask.id} task={subtask} />)}
        </>
    )
}

export function TrackerTasksTable({ tasks }: TrackerTasksTableProps) {
    const taskTree = buildTaskTree(tasks)

    if (tasks.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
                No tasks yet. Create tasks from the Tasks page to start tracking time!
            </div>
        )
    }

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="min-w-[300px]">Task</TableHead>
                        <TableHead className="w-[150px]">Status</TableHead>
                        <TableHead className="w-[180px]">List</TableHead>
                        <TableHead className="w-[140px]">Time Tracker</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {taskTree.map((task) => (
                        <TaskTreeRow key={task.id} task={task} />
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
