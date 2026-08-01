"use client"

import { Plus } from "lucide-react"
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { useTaskDialogStore } from "@/app/(protected)/tasks/_stores/task-dialog-stores"

export function NewListButton() {
    const openListDialog = useTaskDialogStore((state) => state.openListDialog)

    return (
        <SidebarMenuItem>
            <SidebarMenuButton size="sm" onClick={() => openListDialog()}>
                <Plus className="h-3 w-3" />
                <span className="text-sm">New List</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}
