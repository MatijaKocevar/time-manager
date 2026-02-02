import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { UrnikSyncView } from "./components/urnik-sync-view"
import { getCurrentUser } from "../profile/actions/profile-actions"
import { attemptUrnikLogin } from "./actions/urnik-actions"

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

    if (user.urnikUsername && user.urnikPassword) {
        loginResult = await attemptUrnikLogin()
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

    return <UrnikSyncView user={user} translations={urnikTranslations} loginResult={loginResult} />
}
