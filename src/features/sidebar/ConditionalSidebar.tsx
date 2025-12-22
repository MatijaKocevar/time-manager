"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { UserRole } from "@/types"
import type { ListDisplay } from "@/app/(protected)/tasks/schemas/list-schemas"
import { updateSidebarState } from "@/app/(protected)/actions/sidebar-actions"
import { useSidebar } from "@/components/ui/sidebar"
import { useEffect } from "react"
import { PullToRefreshContainer } from "@/components/pull-to-refresh"

interface ConditionalSidebarProps {
    children: React.ReactNode
    defaultOpen: boolean
    sidebarExpandedItems: string[]
    hasSession: boolean
    userRole?: UserRole
    userName?: string | null
    userEmail?: string | null
    lists?: ListDisplay[]
    header?: React.ReactNode
    pendingRequestsCount?: number
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
    sidebarExpandedItems,
    hasSession,
    userRole,
    userName,
    userEmail,
    lists = [],
    header,
    pendingRequestsCount = 0,
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
                        initialExpandedItems={sidebarExpandedItems}
                        pendingRequestsCount={pendingRequestsCount}
                    />
                    <main className="flex flex-1 flex-col min-w-0 w-full h-full overflow-hidden">
                        {header}
                        <PullToRefreshContainer>{children}</PullToRefreshContainer>
                    </main>
                </div>
            </SidebarProvider>
        )
    }

    return <div className="h-full overflow-auto">{children}</div>
}
