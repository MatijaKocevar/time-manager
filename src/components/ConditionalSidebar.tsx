"use client"

import { useSession } from "next-auth/react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

interface ConditionalSidebarProps {
    children: React.ReactNode
    defaultOpen: boolean
}

export function ConditionalSidebar({ children, defaultOpen }: ConditionalSidebarProps) {
    const { data: session, status } = useSession()

    if (status === "loading") {
        return <>{children}</>
    }

    if (session) {
        return (
            <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar />
                <main className="flex-1">
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
                </main>
            </SidebarProvider>
        )
    }

    return <>{children}</>
}
