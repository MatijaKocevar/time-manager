import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authConfig } from "@/lib/auth"
import { getAllRequests } from "../../../requests/actions/request-actions"
import { getHolidays } from "../holidays/actions/holiday-actions"
import { RequestsHistoryList } from "../components/requests-history-list"

export default async function RequestHistoryPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/")
    }

    const [historyRequests, holidaysResult] = await Promise.all([
        getAllRequests(["APPROVED", "REJECTED", "CANCELLED"]),
        getHolidays(),
    ])

    const historyData = historyRequests.map((r) => ({
        ...r,
        user: r.user ?? { id: "unknown", name: null, email: "Unknown" },
    }))

    const holidays = holidaysResult.holidays || []

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex-1 min-h-0">
                <RequestsHistoryList requests={historyData} holidays={holidays} />
            </div>
        </div>
    )
}
