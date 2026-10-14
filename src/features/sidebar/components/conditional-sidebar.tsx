"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { UserRole } from "@/types"
import type { ListDisplay } from "@/app/(protected)/tasks/_schemas/list-schemas"
import { PullToRefreshContainer } from "@/features/pull-to-refresh"
import { useSidebarOpen } from "../hooks/use-sidebar-open"

interface ConditionalSidebarProps {
    children: React.ReactNode
    hasSession: boolean
    userRole?: UserRole
    userName?: string | null
    userEmail?: string | null
    lists?: ListDisplay[]
    header?: React.ReactNode
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

export function ConditionalSidebar({
    children,
    hasSession,
    userRole,
    userName,
    userEmail,
    lists = [],
    header,
    pendingRequestsCount = 0,
    hasUrnikCredentials = false,
    settingsMenuTranslations,
}: ConditionalSidebarProps) {
    const { open, setOpen } = useSidebarOpen()

    if (hasSession) {
        return (
            <SidebarProvider open={open} onOpenChange={setOpen}>
                <div className="flex h-full w-full">
                    <AppSidebar
                        userRole={userRole}
                        userName={userName}
                        userEmail={userEmail}
                        lists={lists}
                        pendingRequestsCount={pendingRequestsCount}
                        hasUrnikCredentials={hasUrnikCredentials}
                        settingsMenuTranslations={settingsMenuTranslations}
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
