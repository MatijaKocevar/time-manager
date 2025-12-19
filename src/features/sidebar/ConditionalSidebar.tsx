"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { AppHeader } from "./app-header"
import { UserRole } from "@/types"
import type { ListDisplay } from "@/app/(protected)/tasks/schemas/list-schemas"
import { updateSidebarState } from "@/app/(protected)/actions/sidebar-actions"
import { useSidebar } from "@/components/ui/sidebar"
import { useEffect } from "react"
import { PullToRefreshContainer } from "@/components/pull-to-refresh"

interface ConditionalSidebarProps {
    children: React.ReactNode
    defaultOpen: boolean
    hasSession: boolean
    userRole?: UserRole
    userName?: string | null
    userEmail?: string | null
    lists?: ListDisplay[]
    breadcrumbTranslations?: Record<string, string>
}

function SidebarStateSync() {
    const { open } = useSidebar()

    useEffect(() => {
        updateSidebarState(open).catch(console.error)
    }, [open])

    return null
}

export function ConditionalSidebar({
    children,
    defaultOpen,
    hasSession,
    userRole,
    userName,
    userEmail,
    lists = [],
    breadcrumbTranslations = {},
}: ConditionalSidebarProps) {
    if (hasSession) {
        return (
            <SidebarProvider defaultOpen={defaultOpen}>
                <SidebarStateSync />
                <div className="flex h-full w-full">
                    <AppSidebar
                        userRole={userRole}
                        userName={userName}
                        userEmail={userEmail}
                        lists={lists}
                    />
                    <main className="flex flex-1 flex-col min-w-0 w-full h-full overflow-hidden">
                        <AppHeader breadcrumbTranslations={breadcrumbTranslations} />
                        <PullToRefreshContainer>{children}</PullToRefreshContainer>
                    </main>
                </div>
            </SidebarProvider>
        )
    }

    return <div className="h-full overflow-auto">{children}</div>
}
