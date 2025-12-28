"use client"

import { useTranslations } from "next-intl"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buildTaskTree } from "../utils/task-tree-helpers"
import { TaskRow } from "./task-row"
import type { TaskDisplay } from "../schemas"

import type { ListDisplay } from "../schemas/list-schemas"

interface TasksFlatTableProps {
    tasks: TaskDisplay[]
    lists: ListDisplay[]
}

export function TasksFlatTable({ tasks, lists }: TasksFlatTableProps) {
    const t = useTranslations("tasks.table")
    const tCommon = useTranslations("common")
    const taskTree = buildTaskTree(tasks)

    if (tasks.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
                {t("noTasks")}
            </div>
        )
    }

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="min-w-[300px]">{t("title")}</TableHead>
                        <TableHead className="w-[150px]">{tCommon("fields.status")}</TableHead>
                        <TableHead className="w-[180px]">{t("list")}</TableHead>
                        <TableHead className="w-[200px]">{t("timeTracker")}</TableHead>
                        <TableHead className="w-[100px] text-right">
                            {tCommon("fields.actions")}
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {taskTree.map((task) => (
                        <TaskRow key={task.id} task={task} lists={lists} />
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
