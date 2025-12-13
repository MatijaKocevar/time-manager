"use client"

import { Plus } from "lucide-react"
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { useTasksStore } from "@/app/(protected)/tasks/stores/tasks-store"

export function NewListButton() {
    const openListDialog = useTasksStore((state) => state.openListDialog)

    return (
        <SidebarMenuItem>
            <SidebarMenuButton size="sm" onClick={() => openListDialog()}>
                <Plus className="h-3 w-3" />
                <span className="text-sm">New List</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}
