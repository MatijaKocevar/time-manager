"use client"

import { useTranslations } from "next-intl"
import { ChevronDown, ChevronRight, Plus, Trash2, Folder, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

function getColorByDepth(depth: number): string {
    const colors = [
        "var(--chart-1)",
        "var(--chart-2)",
        "var(--chart-3)",
        "var(--chart-4)",
        "var(--chart-5)",
    ]
    return colors[depth % colors.length]
}
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useQueryClient } from "@tanstack/react-query"
import { useTasksStore } from "../_stores/tasks-store"
import { toggleTaskExpanded } from "../_actions/task-actions"
import { moveTaskToList } from "../_actions/list-actions"
import { taskKeys, listKeys } from "../query-keys"
import { EditableTaskTitle } from "./editable-task-title"
import { TaskStatusSelect } from "./task-status-select"
import { TaskTimeTracker } from "./task-time-tracker"
import type { TaskTreeNode } from "../_schemas"
import type { ListDisplay } from "../_schemas/list-schemas"

interface TaskCardProps {
    task: TaskTreeNode
    lists: ListDisplay[]
    parentColor?: string
    parentTitle?: string
}

export function TaskCard({ task, lists, parentColor, parentTitle }: TaskCardProps) {
    const queryClient = useQueryClient()
    const t = useTranslations("tasks.form")
    const tTable = useTranslations("tasks.table")
    const tList = useTranslations("tasks.list")
    const tActions = useTranslations("tasks.actions")
    const tCommon = useTranslations("common.fields")
    const openDeleteDialog = useTasksStore((state) => state.openDeleteDialog)
    const openCreateDialog = useTasksStore((state) => state.openCreateDialog)
    const setTaskOperationLoading = useTasksStore((state) => state.setTaskOperationLoading)
    const isOperationLoading = useTasksStore(
        (state) => state.taskOperations.get(task.id)?.isLoading ?? false
    )

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
    const isSubtask = task.depth > 0

    const myColor = getColorByDepth(task.depth)
    const colors = parentColor ? [parentColor, myColor] : [myColor]

    const borderStyle = {
        boxShadow: colors.map((color, i) => `inset ${6 + i * 6}px 0 0 0 ${color}`).join(", "),
        paddingLeft: `${colors.length * 6 + 12}px`,
    }

    return (
        <div>
            <div className="rounded-lg border bg-card p-3 space-y-3" style={borderStyle}>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                        {hasSubtasks && (
                            <button
                                onClick={handleToggleExpand}
                                disabled={isOperationLoading}
                                className="p-1 hover:bg-muted rounded disabled:opacity-50 mt-1 shrink-0"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>
                        )}
                        <div className="flex-1 min-w-0">
                            {isSubtask && parentTitle && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                    {Array.from({ length: task.depth }).map((_, i) => (
                                        <ChevronRight key={i} className="h-3 w-3" />
                                    ))}
                                    <span>
                                        {t("parent")}: {parentTitle}
                                    </span>
                                </div>
                            )}
                            <EditableTaskTitle task={task} />
                            {task.description && (
                                <div className="text-sm text-muted-foreground mt-1">
                                    {task.description}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">
                        {tCommon("status")}
                    </div>
                    <TaskStatusSelect task={task} />
                </div>

                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">
                        {tCommon("list")}
                    </div>
                    {task.parentId ? (
                        <div
                            className="flex items-center gap-2 text-muted-foreground text-sm"
                            title={t("subtasksInheritList")}
                        >
                            <FolderOpen className="h-3 w-3" />
                            <span className="flex items-center gap-1">
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
                            <SelectTrigger className="h-10 w-full">
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
                </div>

                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">
                        {tTable("timeTracker")}
                    </div>
                    <TaskTimeTracker task={task} />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAddSubtask}
                        className="h-9 px-3"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        {tActions("addSubtask")}
                    </Button>
                    {!task.isSystemTask && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            className="h-9 px-3 text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {tActions("delete")}
                        </Button>
                    )}
                </div>
            </div>

            {isExpanded &&
                hasSubtasks &&
                task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="mt-3">
                        <TaskCard
                            task={subtask}
                            lists={lists}
                            parentColor={myColor}
                            parentTitle={task.title}
                        />
                    </div>
                ))}
        </div>
    )
}
