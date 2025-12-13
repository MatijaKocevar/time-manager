"use client"

import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buildTaskTree } from "../utils/task-tree-helpers"
import { TaskRow } from "./task-row"
import type { TaskDisplay } from "../schemas"

interface TasksTableProps {
    tasks: TaskDisplay[]
}

export function TasksTable({ tasks }: TasksTableProps) {
    const taskTree = buildTaskTree(tasks)

    if (tasks.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
                No tasks yet. Create your first task to get started!
            </div>
        )
    }

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="min-w-[300px]">Title</TableHead>
                        <TableHead className="w-[150px]">Status</TableHead>
                        <TableHead className="w-[180px]">List</TableHead>
                        <TableHead className="w-[200px]">Time Tracker</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {taskTree.map((task) => (
                        <TaskRow key={task.id} task={task} />
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
