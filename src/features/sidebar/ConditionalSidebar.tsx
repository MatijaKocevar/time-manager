"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { AppHeader } from "./app-header"
import { UserRole } from "@/types"
import type { ListDisplay } from "@/app/(protected)/tasks/schemas/list-schemas"

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
                <div className="flex h-full w-full">
                    <AppSidebar
                        userRole={userRole}
                        userName={userName}
                        userEmail={userEmail}
                        lists={lists}
                    />
                    <main className="flex flex-1 flex-col min-w-0 w-full h-full overflow-hidden">
                        <AppHeader breadcrumbTranslations={breadcrumbTranslations} />
                        <div className="flex-1 p-4 overflow-auto min-w-0">{children}</div>
                    </main>
                </div>
            </SidebarProvider>
        )
    }

    return <div className="h-full overflow-auto">{children}</div>
}
