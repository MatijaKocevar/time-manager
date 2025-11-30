import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumbs, getBreadcrumbs } from "@/features/breadcrumbs"

export function AppHeader() {
    const breadcrumbs = getBreadcrumbs()

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            {breadcrumbs.length > 0 && (
                <div className="flex-1 min-w-0">
                    <Breadcrumbs items={breadcrumbs} />
                </div>
            )}
        </header>
    )
}
