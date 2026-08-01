"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useTaskDialogStore } from "../_stores/task-dialog-stores"

interface OverviewNewTaskButtonProps {
    listId: string | null
}

export function OverviewNewTaskButton({ listId }: OverviewNewTaskButtonProps) {
    const t = useTranslations("tasks.form")
    const openCreateDialog = useTaskDialogStore((state) => state.openCreateDialog)

    return (
        <Button id="tasks-overview-new-task" onClick={() => openCreateDialog(undefined, listId)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("newTask")}
        </Button>
    )
}
