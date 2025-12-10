import { HoursView } from "./components/hours-view"
import { getHourEntries } from "./actions/hour-actions"
import { getDateRange } from "./utils/view-helpers"
import { SetBreadcrumbData } from "@/features/breadcrumbs/set-breadcrumb-data"

export const dynamic = "force-dynamic"

export default async function HoursPage() {
    const dateRange = getDateRange("WEEKLY", new Date())
    const entries = await getHourEntries(dateRange.startDate, dateRange.endDate)

    return (
        <>
            <SetBreadcrumbData data={{ "/hours": "Hours" }} />
            <HoursView initialEntries={entries} />
        </>
    )
}
