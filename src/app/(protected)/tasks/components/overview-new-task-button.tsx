"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useTasksStore } from "../stores/tasks-store"

interface OverviewNewTaskButtonProps {
    listId: string | null
}

export function OverviewNewTaskButton({ listId }: OverviewNewTaskButtonProps) {
    const openCreateDialog = useTasksStore((state) => state.openCreateDialog)

    return (
        <Button onClick={() => openCreateDialog(undefined, listId)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
        </Button>
    )
}
