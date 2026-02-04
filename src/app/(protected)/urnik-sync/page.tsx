import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { UrnikSyncView } from "./components/urnik-sync-view"
import { getCurrentUser } from "../profile/actions/profile-actions"
import {
    attemptUrnikLogin,
    fetchUrnikRequests,
    calculatePendingRequests,
    syncUrnikStatuses,
    getSubmittedRequests,
} from "./actions/urnik-actions"

export const dynamic = "force-dynamic"

export default async function UrnikSyncPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string }>
}) {
    const params = await searchParams
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        redirect("/login")
    }

    const user = await getCurrentUser()

    if (!user) {
        redirect("/login")
    }

    const today = new Date()
    const currentMonth =
        params.month || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
    const [year, month] = currentMonth.split("-").map(Number)

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    let loginResult: { success: boolean; error?: string } | null = null
    let requestsResult = null
    let pendingRequestsResult = null
    let submittedRequests: Array<{
        id: string
        date: Date
        startTime: string
        endTime: string
        hours: number
        type: string
        urnikType: number
        status: string
        submittedAt: Date
        confirmedAt: Date | null
        errorMessage: string | null
        urnikRequestNo: string | null
    }> = []

    if (user.urnikUsername && user.urnikPassword) {
        loginResult = await attemptUrnikLogin()
        if (loginResult.success) {
            requestsResult = await fetchUrnikRequests(currentMonth)
        }

        await syncUrnikStatuses()

        pendingRequestsResult = await calculatePendingRequests({
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
        })

        const submittedResult = await getSubmittedRequests()
        if (submittedResult.success && submittedResult.data) {
            submittedRequests = submittedResult.data
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
        pendingRequest: t("pendingRequest"),
        submitButton: t("submitButton"),
        calculatedFrom: t("calculatedFrom"),
        inOffice: t("inOffice"),
        remote: t("remote"),
        previousMonth: t("previousMonth"),
        nextMonth: t("nextMonth"),
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <UrnikSyncView
                user={user}
                translations={urnikTranslations}
                requestsResult={requestsResult}
                pendingRequestsResult={pendingRequestsResult}
                submittedRequests={submittedRequests}
                currentMonth={currentMonth}
            />
        </div>
    )
}
