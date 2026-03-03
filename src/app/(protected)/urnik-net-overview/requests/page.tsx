import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { UrnikNetRequestsView } from "./components/urnik-net-requests-view"
import { CreateRequestDialog } from "../components/create-request-dialog"
import { getCurrentUser } from "../../profile/actions/profile-actions"
import {
    attemptUrnikNetLogin,
    fetchUrnikNetRequests,
    calculatePendingUrnikNetRequests,
    syncUrnikNetStatuses,
    getSubmittedUrnikNetRequests,
} from "./actions/urnik-net-requests-actions"

export const dynamic = "force-dynamic"

export default async function UrnikNetRequestsPage({
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
        loginResult = await attemptUrnikNetLogin()
        if (loginResult.success) {
            requestsResult = await fetchUrnikNetRequests(currentMonth)
        }

        await syncUrnikNetStatuses()

        pendingRequestsResult = await calculatePendingUrnikNetRequests({
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
        })

        const submittedResult = await getSubmittedUrnikNetRequests()
        if (submittedResult.success && submittedResult.data) {
            submittedRequests = submittedResult.data
        }
    }

    const t = await getTranslations("clock.urnikNetRequests")
    const tCreateRequest = await getTranslations("urnikNetOverview.createRequest")

    const urnikNetTranslations = {
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
        createRequestButton: tCreateRequest("buttonLabel"),
        hoursLabel: tCreateRequest("hoursLabel"),
        typeWork: tCreateRequest("typeWork"),
        typeWorkFromHome: tCreateRequest("typeWorkFromHome"),
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <UrnikNetRequestsView
                user={user}
                translations={urnikNetTranslations}
                requestsResult={requestsResult}
                pendingRequestsResult={pendingRequestsResult}
                submittedRequests={submittedRequests}
                currentMonth={currentMonth}
            />
            <CreateRequestDialog />
        </div>
    )
}
