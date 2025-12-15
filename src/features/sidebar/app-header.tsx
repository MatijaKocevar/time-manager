"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumbs } from "@/features/breadcrumbs"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"

const staticOverrides = {
    "/users": "Users",
}

export function AppHeader() {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-10 bg-background">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 min-w-0">
                <Breadcrumbs overrides={staticOverrides} />
            </div>
            <div className="flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
            </div>
        </header>
    )
}
