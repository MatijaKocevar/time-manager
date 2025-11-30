"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumbs, useBreadcrumbStore } from "@/features/breadcrumbs"

export function AppHeader() {
    const items = useBreadcrumbStore((state) => state.items)

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            {items.length > 0 && (
                <div className="flex-1 min-w-0">
                    <Breadcrumbs items={items} />
                </div>
            )}
        </header>
    )
}
