"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buildGroupedTaskTree } from "../utils/task-tree-helpers"
import { TaskRow } from "./task-row"
import { getStatusColor } from "../constants/task-statuses"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useTasksStore } from "../stores/tasks-store"
import type { TaskDisplay } from "../schemas"

interface TasksTableProps {
    tasks: TaskDisplay[]
    listId: string | null
}

export function TasksTable({ tasks, listId }: TasksTableProps) {
    const [isMounted, setIsMounted] = useState(false)
    const groupedTasks = buildGroupedTaskTree(tasks)
    const key = listId || "no-list"
    const [defaultExpanded] = useState(() => new Set(["IN_PROGRESS" as const, "TODO" as const]))
    const expandedStatusSections = useTasksStore(
        (state) => state.expandedStatusSections.get(key) || defaultExpanded
    )
    const toggleStatusSection = useTasksStore((state) => state.toggleStatusSection)

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 0)
        return () => clearTimeout(timer)
    }, [])

    if (!isMounted) {
        return null
    }

    return (
        <div className="space-y-6">
            {groupedTasks.map((group) => {
                const isExpanded = expandedStatusSections.has(group.status)

                return (
                    <div key={group.status} className="rounded-md border overflow-x-auto">
                        <button
                            onClick={() => toggleStatusSection(listId, group.status)}
                            className="w-full bg-muted/50 px-4 py-3 border-b hover:bg-muted transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span
                                    className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${getStatusColor(group.status)}`}
                                >
                                    {group.label}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    ({group.count})
                                </span>
                            </div>
                        </button>
                        {isExpanded && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead className="min-w-[300px]">Title</TableHead>
                                        <TableHead className="w-[150px]">Status</TableHead>
                                        <TableHead className="w-[180px]">List</TableHead>
                                        <TableHead className="w-[200px]">Time Tracker</TableHead>
                                        <TableHead className="w-[100px] text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.tasks.map((task) => (
                                        <TaskRow key={task.id} task={task} />
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
