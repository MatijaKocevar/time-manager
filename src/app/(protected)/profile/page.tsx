import { redirect } from "next/navigation"
import { ProfileForm } from "./components/profile-form"
import { PushNotificationManager } from "./components/push-notification-manager"
import { getCurrentUser } from "./actions/profile-actions"
import { hasUserSubscription } from "./actions/notification-actions"

export default async function ProfilePage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/login")
    }

    const { hasSubscription } = await hasUserSubscription()
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

    return (
        <div className="space-y-4">
            <ProfileForm user={user} />
            <PushNotificationManager
                initialHasSubscription={hasSubscription}
                vapidPublicKey={vapidPublicKey}
            />
        </div>
    )
}
