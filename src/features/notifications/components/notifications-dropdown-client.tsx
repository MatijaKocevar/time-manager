"use client"

import { NotificationsDropdown } from "./notifications-dropdown"
import type { NotificationData } from "../actions/notification-actions"

interface NotificationsDropdownClientProps {
    initialNotifications: NotificationData
    translations: {
        title: string
        noNotifications: string
        viewAll: string
        sections: {
            notifications: string
            pendingRequests: string
        }
        requestTypes: {
            VACATION: string
            SICK_LEAVE: string
            WORK_FROM_HOME: string
            OVERTIME_USE: string
        }
        approve?: string
        reject?: string
        awaitingUrnikNet?: string
        urnikSyncFailed?: string
    }
}

export function NotificationsDropdownClient({
    initialNotifications,
    translations,
}: NotificationsDropdownClientProps) {
    return (
        <NotificationsDropdown
            initialNotifications={initialNotifications}
            translations={translations}
        />
    )
}
