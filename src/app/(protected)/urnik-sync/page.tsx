import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { UrnikSyncView } from "./components/urnik-sync-view"
import { getCurrentUser } from "../profile/actions/profile-actions"
import { attemptUrnikLogin, fetchUrnikRequests } from "./actions/urnik-actions"

export default async function UrnikSyncPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        redirect("/login")
    }

    const user = await getCurrentUser()

    if (!user) {
        redirect("/login")
    }

    let loginResult: { success: boolean; error?: string } | null = null
    let requestsResult = null

    if (user.urnikUsername && user.urnikPassword) {
        loginResult = await attemptUrnikLogin()
        if (loginResult.success) {
            requestsResult = await fetchUrnikRequests()
        }
    }

    const t = await getTranslations("urnikSync")

    const urnikTranslations = {
        pageTitle: t("pageTitle"),
        noCredentials: t("noCredentials"),
        goToProfile: t("goToProfile"),
        connectionStatus: t("connectionStatus"),
        connected: t("connected"),
        notConnected: t("notConnected"),
        lastTested: t("lastTested"),
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <UrnikSyncView
                user={user}
                translations={urnikTranslations}
                loginResult={loginResult}
                requestsResult={requestsResult}
            />
        </div>
    )
}
