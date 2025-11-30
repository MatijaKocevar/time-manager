"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { AppHeader } from "./app-header"
import { UserRole } from "@/types"

interface ConditionalSidebarProps {
    children: React.ReactNode
    defaultOpen: boolean
    hasSession: boolean
    userRole?: UserRole
    userName?: string | null
    userEmail?: string | null
}

export function ConditionalSidebar({
    children,
    defaultOpen,
    hasSession,
    userRole,
    userName,
    userEmail,
}: ConditionalSidebarProps) {
    if (hasSession) {
        return (
            <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar userRole={userRole} userName={userName} userEmail={userEmail} />
                <main className="flex flex-1 flex-col min-w-0 w-full">
                    <AppHeader />
                    <div className="flex-1 p-4 md:p-6 overflow-auto min-w-0">{children}</div>
                </main>
            </SidebarProvider>
        )
    }

    return <>{children}</>
}
