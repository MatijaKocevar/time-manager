import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { authConfig } from "@/lib/auth"
import { getAllRequests } from "../../requests/actions/request-actions"
import { getHolidays } from "../holidays/actions/holiday-actions"
import { PendingRequestsList } from "../components/pending-requests-list"
import { SetBreadcrumbData } from "@/features/breadcrumbs/set-breadcrumb-data"

export default async function PendingRequestsPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/")
    }

    const t = await getTranslations("admin.pendingRequests")

    const [requests, holidaysResult] = await Promise.all([
        getAllRequests(["PENDING"]),
        getHolidays(),
    ])

    const requestsData = requests.map((r) => ({
        ...r,
        user: r.user ?? { name: null, email: "Unknown" },
    }))

    const holidays = (holidaysResult.success ? holidaysResult.data : []) ?? []

    return (
        <>
            <SetBreadcrumbData data={{ "/admin/pending-requests": t("title") }} />
            <div className="flex flex-col gap-4 h-full">
                <div className="flex-1 min-h-0">
                    <PendingRequestsList requests={requestsData} holidays={holidays} />
                </div>
            </div>
        </>
    )
}
