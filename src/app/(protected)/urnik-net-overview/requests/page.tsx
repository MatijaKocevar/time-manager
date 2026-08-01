import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { UrnikNetRequestsView } from "./_components/urnik-net-requests-view"
import { CreateRequestDialog } from "./_components/create-request-dialog"
import { getCurrentUser } from "@/app/(protected)/profile/_actions/profile-actions"
import {
    attemptUrnikNetLogin,
    fetchUrnikNetRequests,
    syncUrnikNetStatuses,
    getSubmittedUrnikNetRequests,
} from "./_actions/urnik-net-requests-actions"
import { syncRequestStatuses } from "@/app/(protected)/requests/_actions/sync-request-statuses"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

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

    if (session.user.role === "ADMIN") {
        await syncRequestStatuses()
    }

    const today = new Date()
    const currentMonth =
        params.month || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`

    let loginResult: { success: boolean; error?: string } | null = null
    let requestsResult = null
    let submittedRequests: Array<{
        id: string
        date: Date
        startTime: string | null
        endTime: string | null
        hours: number | null
        type: string
        urnikType: number | null
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

        const submittedResult = await getSubmittedUrnikNetRequests()
        if (submittedResult.success && submittedResult.data) {
            submittedRequests = submittedResult.data
        }
    }

    const t = await getTranslations("clock.urnikNetRequests")
    const tCreateRequest = await getTranslations("urnikNetOverview.createRequest")
    const [tTutorial, tPage, tutorialsSeen] = await Promise.all([
        getTranslations("tutorial"),
        getTranslations("tutorial.urnikNetRequests"),
        getTutorialsSeen(),
    ])

    const urnikNetTranslations = {
        pageTitle: t("pageTitle"),
        noCredentials: t("noCredentials"),
        goToProfile: t("goToProfile"),
        connectionStatus: t("connectionStatus"),
        connected: t("connected"),
        notConnected: t("notConnected"),
        lastTested: t("lastTested"),
        previousMonth: t("previousMonth"),
        nextMonth: t("nextMonth"),
        createRequestButton: tCreateRequest("buttonLabel"),
        hoursLabel: tCreateRequest("hoursLabel"),
        daysLabel: tCreateRequest("daysLabel"),
        typeWork: tCreateRequest("typeWork"),
        typeWorkFromHome: tCreateRequest("typeWorkFromHome"),
        typeVacation: tCreateRequest("typeVacation"),
        typeSickLeave: tCreateRequest("typeSickLeave"),
        typeDayWorkFromHome: tCreateRequest("typeDayWorkFromHome"),
        table: {
            no: t("table.no"),
            requestDate: t("table.requestDate"),
            requestType: t("table.requestType"),
            period: t("table.period"),
            days: t("table.days"),
            hours: t("table.hours"),
            arrival: t("table.arrival"),
            departure: t("table.departure"),
            status: t("table.status"),
            confirmedBy: t("table.confirmedBy"),
            notes: t("table.notes"),
            action: t("table.action"),
        },
        structureChanged: t("structureChanged"),
        structureChangedDescription: t("structureChangedDescription"),
        noRequestsThisMonth: t("noRequestsThisMonth"),
    }

    return (
        <>
            <PageTour
                pageKey="/urnik-net-overview/requests"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#urnik-requests-nav",
                        title: tPage("nav.title"),
                        description: tPage("nav.description"),
                        side: "bottom",
                    },
                    {
                        element: "#urnik-requests-table",
                        title: tPage("table.title"),
                        description: tPage("table.description"),
                        side: "top",
                    },
                ]}
            />
            <div className="flex flex-col gap-4 h-full">
                <UrnikNetRequestsView
                    user={user}
                    translations={urnikNetTranslations}
                    requestsResult={requestsResult}
                    submittedRequests={submittedRequests}
                    currentMonth={currentMonth}
                />
                <CreateRequestDialog />
            </div>
        </>
    )
}
