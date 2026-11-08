"use client"

import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTaskDialogStore } from "@/app/(protected)/tasks/_stores/task-dialog-stores"

export function NewTaskButton() {
    const pathname = usePathname()
    const t = useTranslations("tasks.form")
    const openCreateDialog = useTaskDialogStore((state) => state.openCreateDialog)

    const segments = pathname.split("/")
    const isTasksRoute = segments[1] === "tasks"
    const isTimeSheetsRoute = segments[1] === "time-sheets"

    if (!isTasksRoute && !isTimeSheetsRoute) {
        return null
    }

    const listId = isTasksRoute ? (segments[2] ?? null) : null
    const requireList = isTimeSheetsRoute || listId === null
    const targetListId = listId === "no-list" ? null : listId

    return (
        <Button
            id="tasks-list-new-task"
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => openCreateDialog(undefined, targetListId, requireList)}
            aria-label={t("newTask")}
        >
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground hidden md:inline">{t("newTask")}</span>
        </Button>
    )
}
