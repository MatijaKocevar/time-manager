"use client"

import { useQuery } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Folder, Plus } from "lucide-react"
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { getLists } from "@/app/(protected)/tasks/actions/list-actions"
import { listKeys } from "@/app/(protected)/tasks/query-keys"
import { useTasksStore } from "@/app/(protected)/tasks/stores/tasks-store"

export function DynamicListItems() {
    const pathname = usePathname()
    const openListDialog = useTasksStore((state) => state.openListDialog)

    const { data: lists = [] } = useQuery({
        queryKey: listKeys.all,
        queryFn: getLists,
    })

    return (
        <div className="ml-4 mt-1">
            {lists.map((list) => {
                const listUrl = `/tasks/${list.id}`
                const isActive = pathname === listUrl
                return (
                    <SidebarMenuItem key={list.id}>
                        <SidebarMenuButton asChild size="sm" isActive={isActive}>
                            <Link href={listUrl}>
                                <Folder className="h-3 w-3" />
                                <span className="text-sm flex items-center gap-1">
                                    {list.color && (
                                        <span
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: list.color }}
                                        />
                                    )}
                                    {list.name}
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            })}
            <SidebarMenuItem>
                <SidebarMenuButton size="sm" onClick={() => openListDialog()}>
                    <Plus className="h-3 w-3" />
                    <span className="text-sm">New List</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </div>
    )
}
