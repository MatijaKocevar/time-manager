"use client"

import { useEffect, useState } from "react"
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
            OTHER: string
        }
        approve?: string
        reject?: string
    }
}

export function NotificationsDropdownClient({
    initialNotifications,
    translations,
}: NotificationsDropdownClientProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <NotificationsDropdown
            initialNotifications={initialNotifications}
            translations={translations}
        />
    )
}
