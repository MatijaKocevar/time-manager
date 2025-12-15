"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useTasksStore } from "../stores/tasks-store"

interface OverviewNewTaskButtonProps {
    listId: string | null
}

export function OverviewNewTaskButton({ listId }: OverviewNewTaskButtonProps) {
    const t = useTranslations("tasks.form")
    const openCreateDialog = useTasksStore((state) => state.openCreateDialog)

    return (
        <Button onClick={() => openCreateDialog(undefined, listId)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("newTask")}
        </Button>
    )
}
