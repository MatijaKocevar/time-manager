import { redirect } from "next/navigation"
import { ProfileForm } from "./components/profile-form"
import { UserAvatar } from "@/components/user-avatar"
import { PushNotificationManager } from "@/components/notifications/push-notification-manager"
import { getCurrentUser } from "./actions/profile-actions"
import { ROLE_COLORS } from "./constants/profile-constants"

export default async function ProfilePage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
                <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
                    <UserAvatar role={user.role} className="h-24 w-24" />
                    <div className="text-center">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <span
                            className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[user.role]}`}
                        >
                            {user.role}
                        </span>
                    </div>
                </div>
            </div>
            <div className="md:col-span-2 space-y-6">
                <ProfileForm user={user} />
                <PushNotificationManager />
            </div>
        </div>
    )
}
