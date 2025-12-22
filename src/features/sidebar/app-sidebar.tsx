"use client"

import { Users, MoreHorizontal, Edit, Trash, ChevronRight, ChevronDown } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState, useEffect } from "react"

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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/user-avatar"
import { navigationItems } from "@/config/navigation"
import { UserRole } from "@/types"
import type { ListDisplay } from "@/app/(protected)/tasks/schemas/list-schemas"
import { Folder } from "lucide-react"
import { NewListButton } from "./new-list-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTasksStore } from "@/app/(protected)/tasks/stores/tasks-store"
import { deleteList } from "@/app/(protected)/tasks/actions/list-actions"
import { updateSidebarExpandedItems } from "@/app/(protected)/actions/sidebar-actions"
import { useQueryClient } from "@tanstack/react-query"
import { listKeys } from "@/app/(protected)/tasks/query-keys"

interface AppSidebarProps {
    userRole?: UserRole
    userName?: string | null
    userEmail?: string | null
    lists?: ListDisplay[]
    initialExpandedItems?: string[]
    pendingRequestsCount?: number
}

export function AppSidebar({
    userRole,
    userName,
    userEmail,
    lists = [],
    initialExpandedItems = [],
    pendingRequestsCount = 0,
}: AppSidebarProps) {
    const pathname = usePathname()
    const queryClient = useQueryClient()
    const openListDialog = useTasksStore((state) => state.openListDialog)
    const [deletingListId, setDeletingListId] = useState<string | null>(null)
    const [expandedItemsSet, setExpandedItemsSet] = useState(() => new Set(initialExpandedItems))
    const [hasInitialized, setHasInitialized] = useState(false)
    const t = useTranslations()
    const tNav = useTranslations("navigation")
    const tCommon = useTranslations("common")
    const tTasks = useTranslations("tasks")

    useEffect(() => {
        if (!hasInitialized) {
            setHasInitialized(true)
            return
        }
        const items = Array.from(expandedItemsSet)
        updateSidebarExpandedItems(items).catch(console.error)
    }, [expandedItemsSet, hasInitialized])

    const toggleItem = (itemUrl: string) => {
        setExpandedItemsSet((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(itemUrl)) {
                newSet.delete(itemUrl)
            } else {
                newSet.add(itemUrl)
            }
            return newSet
        })
    }

    const isExpanded = (itemUrl: string) => expandedItemsSet.has(itemUrl)

    const filteredItems = navigationItems.filter((item) =>
        userRole ? item.roles.includes(userRole) : false
    )

    const handleEditList = (listId: string) => {
        openListDialog(listId)
    }

    const handleDeleteList = async (listId: string) => {
        if (!confirm(tTasks("list.deleteConfirm"))) {
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
                                <span className="truncate font-semibold">
                                    {t("metadata.title")}
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>{tNav("management")}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {filteredItems.map((item) => {
                                const isActive =
                                    pathname === item.url || pathname.startsWith(item.url + "/")
                                const isTasksItem = item.url === "/tasks"
                                const hasChildren =
                                    isTasksItem || (item.children && item.children.length > 0)
                                const itemExpanded = isExpanded(item.url)
                                return (
                                    <div key={item.title}>
                                        <SidebarMenuItem>
                                            <div className="flex items-center w-full">
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isActive}
                                                    className="w-full"
                                                >
                                                    <a href={item.url}>
                                                        <item.icon />
                                                        <span>{t(item.title)}</span>
                                                    </a>
                                                </SidebarMenuButton>
                                                {hasChildren && (
                                                    <button
                                                        type="button"
                                                        className="flex items-center justify-center h-8 w-8 hover:bg-accent hover:text-accent-foreground rounded-md ml-auto"
                                                        onClick={() => toggleItem(item.url)}
                                                    >
                                                        {itemExpanded ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </SidebarMenuItem>
                                        {isTasksItem && itemExpanded && (
                                            <div className="ml-4 mt-1">
                                                <SidebarMenuItem>
                                                    <SidebarMenuButton
                                                        asChild
                                                        size="sm"
                                                        isActive={pathname === "/tasks/no-list"}
                                                    >
                                                        <Link href="/tasks/no-list">
                                                            <Folder className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-sm">
                                                                {tTasks("list.noList")}
                                                            </span>
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
                                                                                {tTasks(
                                                                                    "list.listOptions"
                                                                                )}
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
                                                                            {tTasks("list.rename")}
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
                                                                            {tCommon(
                                                                                "actions.delete"
                                                                            )}
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
                                        {item.children &&
                                            item.children.length > 0 &&
                                            itemExpanded && (
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
                                                                            {t(child.title)}
                                                                        </span>
                                                                        {child.url ===
                                                                            "/admin/pending-requests" &&
                                                                            pendingRequestsCount >
                                                                                0 && (
                                                                                <Badge
                                                                                    variant="destructive"
                                                                                    className="ml-auto h-5 px-1.5 text-xs"
                                                                                >
                                                                                    {
                                                                                        pendingRequestsCount
                                                                                    }
                                                                                </Badge>
                                                                            )}
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
                        <SidebarMenuButton
                            size="lg"
                            className="cursor-default hover:bg-transparent"
                        >
                            <UserAvatar role={userRole} className="h-8 w-8" />
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{userName}</span>
                                <span className="truncate text-xs">{userEmail}</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
