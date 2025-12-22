import { getTranslations } from "next-intl/server"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumbs } from "@/features/breadcrumbs"
import { SettingsMenu } from "./settings-menu"
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown"
import { getNotifications } from "@/app/(protected)/actions/notification-actions"

interface AppHeaderProps {
    breadcrumbTranslations: Record<string, string>
}

export async function AppHeader({ breadcrumbTranslations }: AppHeaderProps) {
    const t = await getTranslations("header")
    const tRequests = await getTranslations("requests.types")

    const notifications = await getNotifications()

    const menuTranslations = {
        settings: t("menu.settings"),
        language: t("menu.language"),
        theme: t("menu.theme"),
    }

    const notificationsTranslations = {
        title: t("notifications.title"),
        noNotifications: t("notifications.noNotifications"),
        viewAll: t("notifications.viewAll"),
        sections: {
            notifications: t("notifications.sections.notifications"),
            pendingRequests: t("notifications.sections.pendingRequests"),
        },
        requestTypes: {
            VACATION: tRequests("vacation"),
            SICK_LEAVE: tRequests("sickLeave"),
            WORK_FROM_HOME: tRequests("workFromHome"),
            OTHER: tRequests("other"),
        },
    }

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-10 bg-background">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 min-w-0">
                <Breadcrumbs overrides={breadcrumbTranslations} />
            </div>
            <div className="flex items-center gap-2">
                <NotificationsDropdown
                    notifications={notifications}
                    translations={notificationsTranslations}
                />
                <SettingsMenu translations={menuTranslations} />
            </div>
        </header>
    )
}
