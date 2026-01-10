import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ProfileForm } from "./components/profile-form"
import { PushNotificationManager } from "./components/push-notification-manager"
import { NotificationPreferences } from "./components/notification-preferences"
import { getCurrentUser } from "./actions/profile-actions"
import {
    hasUserSubscription,
    getNotificationPreferences,
} from "@/features/notifications/actions/notification-actions"

export default async function ProfilePage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/login")
    }

    const t = await getTranslations("profile.messages")

    const { hasSubscription } = await hasUserSubscription()
    const { preferences, error } = await getNotificationPreferences()
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

    if (error || !preferences) {
        return <div>{t("errorLoadingPreferences")}</div>
    }

    return (
        <div className="space-y-4">
            <ProfileForm user={user} />
            <PushNotificationManager
                initialHasSubscription={hasSubscription}
                vapidPublicKey={vapidPublicKey}
            />
            <NotificationPreferences initialPreferences={preferences} userRole={user.role} />
        </div>
    )
}
