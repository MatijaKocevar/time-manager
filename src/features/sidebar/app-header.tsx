"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumbs } from "@/features/breadcrumbs"
import { ThemeToggle } from "@/components/theme-toggle"

const staticOverrides = {
    "/users": "Users",
}

export function AppHeader() {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 min-w-0">
                <Breadcrumbs overrides={staticOverrides} />
            </div>
            <ThemeToggle />
        </header>
    )
}
