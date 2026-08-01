import { getTranslations } from "next-intl/server"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumbs } from "@/features/breadcrumbs"
import { NotificationsDropdownClient } from "@/features/notifications/components/notifications-dropdown-client"
import { getNotifications } from "@/features/notifications/actions/notification-actions"
import { getActiveTimer } from "@/app/(protected)/shared/_actions/timer-actions"
import { getTasks } from "@/app/(protected)/tasks/_actions/task-actions"
import { TASK_STATUS } from "@/app/(protected)/tasks/_constants/task-statuses"
import { TimerStatusCompact } from "./timer-status-compact"

interface AppHeaderProps {
    breadcrumbTranslations: Record<string, string>
}

export async function AppHeader({ breadcrumbTranslations }: AppHeaderProps) {
    const t = await getTranslations("header")
    const tRequests = await getTranslations("requests.types")
    const tCommon = await getTranslations("common.actions")
    const tClock = await getTranslations("clock.arrivalDialog")

    const [notifications, activeTimer, inProgressTasks] = await Promise.all([
        getNotifications(),
        getActiveTimer(),
        getTasks({ status: TASK_STATUS.IN_PROGRESS }),
    ])

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
        },
        approve: tCommon("approve"),
        reject: tCommon("reject"),
        awaitingUrnikNet: t("notifications.awaitingUrnikNet"),
        urnikSyncFailed: t("notifications.urnikSyncFailed"),
    }

    const timerStatusTranslations = {
        startTracking: t("timerStatus.startTracking"),
        selectTask: t("timerStatus.selectTask"),
        noTasksInProgress: t("timerStatus.noTasksInProgress"),
        arrivalDialog: {
            title: tClock("title"),
            message: tClock("message"),
            yesButton: tClock("yesButton"),
            noButton: tClock("noButton"),
            successMessage: tClock("successMessage"),
            errorTitle: tClock("errorTitle"),
            workFromHomeCheckbox: tClock("workFromHomeCheckbox"),
            workFromHomeApproved: tClock("workFromHomeApproved"),
        },
    }

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-10 bg-background">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 min-w-0">
                <Breadcrumbs overrides={breadcrumbTranslations} />
            </div>
            <div className="flex items-center gap-2">
                <TimerStatusCompact
                    initialActiveTimer={activeTimer}
                    inProgressTasks={inProgressTasks}
                    translations={timerStatusTranslations}
                />
                <NotificationsDropdownClient
                    initialNotifications={notifications}
                    translations={notificationsTranslations}
                />
            </div>
        </header>
    )
}
