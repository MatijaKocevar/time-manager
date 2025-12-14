"use client"

import { Users, LogOut, UserCircle, ChevronUp, MoreHorizontal, Edit, Trash } from "lucide-react"
import { signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/user-avatar"
import { navigationItems } from "@/config/navigation"
import { UserRole } from "@/types"
import type { ListDisplay } from "@/app/(protected)/tasks/schemas/list-schemas"
import { Folder } from "lucide-react"
import { NewListButton } from "./new-list-button"
import { Button } from "@/components/ui/button"
import { useTasksStore } from "@/app/(protected)/tasks/stores/tasks-store"
import { deleteList } from "@/app/(protected)/tasks/actions/list-actions"
import { useQueryClient } from "@tanstack/react-query"
import { listKeys } from "@/app/(protected)/tasks/query-keys"

interface AppSidebarProps {
    userRole?: UserRole
    userName?: string | null
    userEmail?: string | null
    lists?: ListDisplay[]
}

export function AppSidebar({ userRole, userName, userEmail, lists = [] }: AppSidebarProps) {
    const pathname = usePathname()
    const queryClient = useQueryClient()
    const openListDialog = useTasksStore((state) => state.openListDialog)
    const [deletingListId, setDeletingListId] = useState<string | null>(null)

    const filteredItems = navigationItems.filter((item) =>
        userRole ? item.roles.includes(userRole) : false
    )

    const handleEditList = (listId: string) => {
        openListDialog(listId)
    }

    const handleDeleteList = async (listId: string) => {
        if (
            !confirm("Are you sure you want to delete this list? Tasks will be moved to No List.")
        ) {
            return
        }
        setDeletingListId(listId)
        try {
            const result = await deleteList({ id: listId })
            if (result.success) {
                await queryClient.invalidateQueries({ queryKey: listKeys.all })
                if (pathname.includes(listId)) {
                    window.location.href = "/tasks"
                }
            } else {
                alert(result.error || "Failed to delete list")
            }
        } catch (error) {
            console.error("Failed to delete list:", error)
            alert("Failed to delete list")
        } finally {
            setDeletingListId(null)
        }
    }

    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <Users className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">Time Manager</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Management</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {filteredItems.map((item) => {
                                const isActive =
                                    pathname === item.url || pathname.startsWith(item.url + "/")
                                const isTasksItem = item.url === "/tasks"
                                return (
                                    <div key={item.title}>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton asChild isActive={isActive}>
                                                <a href={item.url}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </a>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                        {isTasksItem && (
                                            <div className="ml-4 mt-1">
                                                <SidebarMenuItem>
                                                    <SidebarMenuButton
                                                        asChild
                                                        size="sm"
                                                        isActive={pathname === "/tasks/no-list"}
                                                    >
                                                        <Link href="/tasks/no-list">
                                                            <Folder className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-sm">No List</span>
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                                {lists.map((list) => {
                                                    const listUrl = `/tasks/${list.id}`
                                                    const isListActive = pathname === listUrl
                                                    const isDeleting = deletingListId === list.id
                                                    return (
                                                        <SidebarMenuItem key={list.id}>
                                                            <div className="flex items-center gap-1 w-full">
                                                                <SidebarMenuButton
                                                                    asChild
                                                                    size="sm"
                                                                    isActive={isListActive}
                                                                    className="flex-1"
                                                                    disabled={isDeleting}
                                                                >
                                                                    <a href={listUrl}>
                                                                        <Folder className="h-3 w-3" />
                                                                        <span className="text-sm flex items-center gap-1">
                                                                            {list.color && (
                                                                                <span
                                                                                    className="h-2 w-2 rounded-full"
                                                                                    style={{
                                                                                        backgroundColor:
                                                                                            list.color,
                                                                                    }}
                                                                                />
                                                                            )}
                                                                            {list.name}
                                                                        </span>
                                                                    </a>
                                                                </SidebarMenuButton>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0"
                                                                            disabled={isDeleting}
                                                                        >
                                                                            <MoreHorizontal className="h-3 w-3" />
                                                                            <span className="sr-only">
                                                                                List options
                                                                            </span>
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                handleEditList(
                                                                                    list.id
                                                                                )
                                                                            }
                                                                        >
                                                                            <Edit className="mr-2 h-3 w-3" />
                                                                            Rename
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                handleDeleteList(
                                                                                    list.id
                                                                                )
                                                                            }
                                                                            className="text-destructive"
                                                                        >
                                                                            <Trash className="mr-2 h-3 w-3" />
                                                                            Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </SidebarMenuItem>
                                                    )
                                                })}
                                                <NewListButton />
                                            </div>
                                        )}
                                        {item.children && item.children.length > 0 && (
                                            <div className="ml-4 mt-1">
                                                {item.children.map((child) => {
                                                    const isChildActive =
                                                        pathname === child.url ||
                                                        pathname.startsWith(child.url + "/")
                                                    return (
                                                        <SidebarMenuItem key={child.title}>
                                                            <SidebarMenuButton
                                                                asChild
                                                                size="sm"
                                                                isActive={isChildActive}
                                                            >
                                                                <a href={child.url}>
                                                                    <child.icon className="h-3 w-3" />
                                                                    <span className="text-sm">
                                                                        {child.title}
                                                                    </span>
                                                                </a>
                                                            </SidebarMenuButton>
                                                        </SidebarMenuItem>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg">
                                    <UserAvatar role={userRole} className="h-8 w-8" />
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{userName}</span>
                                        <span className="truncate text-xs">{userEmail}</span>
                                    </div>
                                    <ChevronUp className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                align="end"
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                            >
                                <DropdownMenuLabel className="text-xs text-muted-foreground">
                                    {userEmail}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <a href="/profile">
                                        <UserCircle className="mr-2 h-4 w-4" />
                                        Profile
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
