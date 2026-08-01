"use client"

import { MoreHorizontal, Edit, Trash, ChevronRight, ChevronDown, Lock } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState, useEffect, useRef } from "react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/user-avatar"
import { AppLogo } from "@/components/app-logo"
import { navigationItems } from "@/features/navigation/config"
import { UserRole } from "@/types"
import type { ListDisplay } from "@/app/(protected)/tasks/_schemas/list-schemas"
import { Folder } from "lucide-react"
import { NewListButton } from "./new-list-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTasksStore } from "@/app/(protected)/tasks/_stores/tasks-store"
import { useTaskDialogStore } from "@/app/(protected)/tasks/_stores/task-dialog-stores"
import { updateSidebarExpandedItems } from "../actions/sidebar-actions"
import { useIsMobile } from "@/hooks/use-mobile"
import { SettingsMenu } from "./settings-menu"

interface AppSidebarProps {
    userRole?: UserRole
    userName?: string | null
    userEmail?: string | null
    lists?: ListDisplay[]
    initialExpandedItems?: string[]
    pendingRequestsCount?: number
    hasUrnikCredentials?: boolean
    settingsMenuTranslations?: {
        settings: string
        language: string
        theme: string
        profile: string
        logout: string
        restartTutorial: string
    }
}

export function AppSidebar({
    userRole,
    userName,
    userEmail,
    lists = [],
    initialExpandedItems = [],
    pendingRequestsCount = 0,
    hasUrnikCredentials = false,
    settingsMenuTranslations,
}: AppSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { setOpenMobile } = useSidebar()
    const isMobile = useIsMobile()
    const openListDialog = useTaskDialogStore((state) => state.openListDialog)
    const deletingListId = useTasksStore((state) => state.deletingListId)
    const deleteList = useTasksStore((state) => state.deleteList)
    const [expandedItemsSet, setExpandedItemsSet] = useState(() => new Set(initialExpandedItems))
    const hasInitializedRef = useRef(false)
    const t = useTranslations()
    const tCommon = useTranslations("common")
    const tTasks = useTranslations("tasks")

    const handleNavigationClick = () => {
        if (isMobile) {
            setOpenMobile(false)
        }
    }

    useEffect(() => {
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true
            return
        }
        const items = Array.from(expandedItemsSet)
        updateSidebarExpandedItems(items).catch(console.error)
    }, [expandedItemsSet])

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

    const filteredItems = navigationItems.filter((item) => {
        if (!userRole || !item.roles.includes(userRole)) {
            return false
        }
        if (item.requiresUrnikCredentials && !hasUrnikCredentials) {
            return false
        }
        return true
    })

    const handleEditList = (listId: string) => {
        const list = lists.find((l) => l.id === listId)
        openListDialog(listId, {
            name: list?.name ?? "",
            description: list?.description ?? "",
            color: list?.color ?? "#3b82f6",
            isPrivate: list?.isPrivate ?? false,
        })
    }

    const onDeleteList = async (listId: string) => {
        const success = await deleteList(listId, tTasks("list.deleteConfirm"))
        if (success && pathname.includes(listId)) {
            router.push("/tasks")
        }
    }

    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild size="lg">
                            <Link href="/time-sheets" onClick={handleNavigationClick}>
                                <AppLogo size="md" showText={true} />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
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
                                                    <Link
                                                        href={item.url}
                                                        onClick={handleNavigationClick}
                                                    >
                                                        <item.icon />
                                                        <span>{t(item.title)}</span>
                                                    </Link>
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
                                                        <Link
                                                            href="/tasks/no-list"
                                                            onClick={handleNavigationClick}
                                                        >
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
                                                                    <Link
                                                                        href={listUrl}
                                                                        onClick={
                                                                            handleNavigationClick
                                                                        }
                                                                    >
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
                                                                            {list.isPrivate && (
                                                                                <Lock className="h-3 w-3 text-muted-foreground" />
                                                                            )}
                                                                        </span>
                                                                    </Link>
                                                                </SidebarMenuButton>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0"
                                                                            disabled={isDeleting}
                                                                            aria-label={tTasks(
                                                                                "list.listOptions"
                                                                            )}
                                                                        >
                                                                            <MoreHorizontal className="h-3 w-3" />
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
                                                                                onDeleteList(
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
                                                                    <Link
                                                                        href={child.url}
                                                                        onClick={
                                                                            handleNavigationClick
                                                                        }
                                                                    >
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
                                                                    </Link>
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
                        <div className="flex items-center gap-1">
                            <SidebarMenuButton
                                size="lg"
                                className="cursor-default hover:bg-transparent flex-1 min-w-0"
                            >
                                <UserAvatar role={userRole} className="h-8 w-8" />
                                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                                    <span className="truncate font-semibold">{userName}</span>
                                    <span className="truncate text-xs">{userEmail}</span>
                                </div>
                            </SidebarMenuButton>
                            {settingsMenuTranslations && (
                                <SettingsMenu
                                    translations={settingsMenuTranslations}
                                    onNavigate={handleNavigationClick}
                                />
                            )}
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
