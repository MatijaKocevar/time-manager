import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ProfileForm } from "./components/profile-form"
import { PushNotificationManager } from "./components/push-notification-manager"
import { NotificationPreferences } from "./components/notification-preferences"
import { UrnikCredentialsForm } from "./components/urnik-credentials-form"
import { AutoCheckinPreferences } from "./components/auto-checkin-preferences"
import { getCurrentUser, getAutoCheckinPreferences } from "./actions/profile-actions"
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
    const tUrnik = await getTranslations("profile.urnikCredentials")

    const { hasSubscription } = await hasUserSubscription()
    const { preferences, error } = await getNotificationPreferences()
    const autoCheckinResult = await getAutoCheckinPreferences()
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

    if (error || !preferences) {
        return <div>{t("errorLoadingPreferences")}</div>
    }

    if (autoCheckinResult.error || !autoCheckinResult.preferences) {
        return <div>{t("errorLoadingPreferences")}</div>
    }

    const urnikTranslations = {
        title: tUrnik("title"),
        description: tUrnik("description"),
        username: tUrnik("username"),
        password: tUrnik("password"),
        usernamePlaceholder: tUrnik("usernamePlaceholder"),
        passwordPlaceholder: tUrnik("passwordPlaceholder"),
        saveCredentials: tUrnik("saveCredentials"),
        testConnection: tUrnik("testConnection"),
        clearCredentials: tUrnik("clearCredentials"),
        updateSuccess: tUrnik("updateSuccess"),
        testSuccess: tUrnik("testSuccess"),
        clearSuccess: tUrnik("clearSuccess"),
        lastTested: tUrnik("lastTested"),
        notTested: tUrnik("notTested"),
        testing: tUrnik("testing"),
        saving: tUrnik("saving"),
    }

    return (
        <div className="space-y-4">
            <ProfileForm user={user} todayAdjustment={user.workTimeAdjustments[0] ?? null} />
            <UrnikCredentialsForm
                initialUsername={user.urnikUsername}
                hasCredentials={!!user.urnikUsername}
                lastTestAt={user.lastUrnikTestAt}
                isDemo={user.isDemo}
                translations={urnikTranslations}
            />
            <AutoCheckinPreferences
                initialEnabled={autoCheckinResult.preferences.autoCheckInEnabled}
                initialCheckoutEnabled={autoCheckinResult.preferences.autoCheckOutEnabled}
                isDemo={user.isDemo}
            />
            <PushNotificationManager
                initialHasSubscription={hasSubscription}
                vapidPublicKey={vapidPublicKey}
            />
            <NotificationPreferences initialPreferences={preferences} userRole={user.role} />
        </div>
    )
}
