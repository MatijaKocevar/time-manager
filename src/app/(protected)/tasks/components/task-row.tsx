"use client"

import { useTranslations } from "next-intl"
import { ChevronDown, ChevronRight, Plus, Trash2, Folder, FolderOpen } from "lucide-react"
import { Fragment } from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { useTasksStore } from "../stores/tasks-store"
import { toggleTaskExpanded } from "../actions/task-actions"
import { moveTaskToList } from "../actions/list-actions"
import { getLists } from "../actions/list-actions"
import { taskKeys, listKeys } from "../query-keys"
import { EditableTaskTitle } from "./editable-task-title"
import { TaskStatusSelect } from "./task-status-select"
import { TaskTimeTracker } from "./task-time-tracker"
import type { TaskTreeNode } from "../schemas"

interface TaskRowProps {
    task: TaskTreeNode
}

export function TaskRow({ task }: TaskRowProps) {
    const queryClient = useQueryClient()
    const t = useTranslations("tasks.form")
    const tList = useTranslations("tasks.list")
    const tActions = useTranslations("tasks.actions")
    const openDeleteDialog = useTasksStore((state) => state.openDeleteDialog)
    const openCreateDialog = useTasksStore((state) => state.openCreateDialog)
    const setTaskOperationLoading = useTasksStore((state) => state.setTaskOperationLoading)
    const isOperationLoading = useTasksStore(
        (state) => state.taskOperations.get(task.id)?.isLoading ?? false
    )

    const { data: lists = [] } = useQuery({
        queryKey: listKeys.all,
        queryFn: getLists,
    })

    const isExpanded = task.isExpanded
    const hasSubtasks = task.subtasks && task.subtasks.length > 0

    const handleToggleExpand = async () => {
        if (!hasSubtasks || isOperationLoading) return

        setTaskOperationLoading(task.id, true)
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
            setTaskOperationLoading(task.id, false)
        }
    }

    const handleAddSubtask = () => {
        openCreateDialog(task.id)
    }

    const handleDelete = () => {
        openDeleteDialog(task.id)
    }

    const handleListChange = async (listId: string) => {
        setTaskOperationLoading(task.id, true)
        try {
            const result = await moveTaskToList({
                taskId: task.id,
                listId: listId === "none" ? null : listId,
            })

            if (result.success) {
                await queryClient.invalidateQueries({ queryKey: taskKeys.all })
                await queryClient.invalidateQueries({ queryKey: listKeys.all })
            }
        } catch (error) {
            console.error("Failed to move task:", error)
        } finally {
            setTaskOperationLoading(task.id, false)
        }
    }

    const currentList = lists.find((list) => list.id === task.listId)

    return (
        <>
            <TableRow className="hover:bg-muted/50">
                <TableCell>
                    {hasSubtasks ? (
                        <button
                            onClick={handleToggleExpand}
                            disabled={isOperationLoading}
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
                    {task.parentId ? (
                        <div
                            className="flex items-center gap-2 text-muted-foreground"
                            title={t("subtasksInheritList")}
                        >
                            <FolderOpen className="h-3 w-3" />
                            <span className="text-sm flex items-center gap-1">
                                {currentList?.color && (
                                    <span
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: currentList.color }}
                                    />
                                )}
                                {currentList?.name ?? tList("noList")}
                            </span>
                        </div>
                    ) : (
                        <Select
                            value={task.listId ?? "none"}
                            onValueChange={handleListChange}
                            disabled={isOperationLoading}
                        >
                            <SelectTrigger className="h-8 w-[180px]">
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                        {task.listId ? (
                                            <FolderOpen className="h-3 w-3" />
                                        ) : (
                                            <Folder className="h-3 w-3 text-muted-foreground" />
                                        )}
                                        <span className="text-sm flex items-center gap-1">
                                            {currentList?.color && (
                                                <span
                                                    className="h-2 w-2 rounded-full"
                                                    style={{ backgroundColor: currentList.color }}
                                                />
                                            )}
                                            {currentList?.name ?? tList("noList")}
                                        </span>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    <div className="flex items-center gap-2">
                                        <Folder className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm">{tList("noList")}</span>
                                    </div>
                                </SelectItem>
                                {lists.map((list) => (
                                    <SelectItem key={list.id} value={list.id}>
                                        <div className="flex items-center gap-2">
                                            <FolderOpen className="h-3 w-3" />
                                            <span className="text-sm flex items-center gap-1">
                                                {list.color && (
                                                    <span
                                                        className="h-2 w-2 rounded-full"
                                                        style={{ backgroundColor: list.color }}
                                                    />
                                                )}
                                                {list.name}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
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
                            <span className="sr-only">{tActions("addSubtask")}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            className="h-8 w-8 p-0 text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t("deleteTask")}</span>
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
