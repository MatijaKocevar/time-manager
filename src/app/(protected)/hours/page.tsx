import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { HoursView } from "./components/hours-view"
import { getHourEntries } from "./actions/hour-actions"
import { getDateRange } from "./utils/view-helpers"
import { SetBreadcrumbData } from "@/features/breadcrumbs/set-breadcrumb-data"

export const dynamic = "force-dynamic"

export default async function HoursPage() {
    const session = await getServerSession(authConfig)
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const dateRange = getDateRange("WEEKLY", new Date())
    const entries = await getHourEntries(dateRange.startDate, dateRange.endDate)

    return (
        <>
            <SetBreadcrumbData data={{ "/hours": "Hours" }} />
            <HoursView initialEntries={entries} userId={session.user.id} />
        </>
    )
}
