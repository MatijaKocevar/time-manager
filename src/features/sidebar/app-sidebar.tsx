"use client"

import { Users, LogOut, UserCircle, ChevronUp } from "lucide-react"
import { signOut } from "next-auth/react"
import { usePathname } from "next/navigation"

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

interface AppSidebarProps {
    userRole?: UserRole
    userName?: string | null
    userEmail?: string | null
}

export function AppSidebar({ userRole, userName, userEmail }: AppSidebarProps) {
    const pathname = usePathname()
    const filteredItems = navigationItems.filter((item) =>
        userRole ? item.roles.includes(userRole) : false
    )

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
                                const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
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
                                        {item.children && item.children.length > 0 && (
                                            <div className="ml-4 mt-1">
                                                {item.children.map((child) => {
                                                    const isChildActive = pathname === child.url || pathname.startsWith(child.url + "/")
                                                    return (
                                                        <SidebarMenuItem key={child.title}>
                                                            <SidebarMenuButton asChild size="sm" isActive={isChildActive}>
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
