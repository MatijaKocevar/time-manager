import { getServerSession } from "next-auth"
import { cookies } from "next/headers"
import { getTranslations } from "next-intl/server"
import { authConfig } from "@/lib/auth"
import { HoursView } from "./components/hours-view"
import { getHourEntries } from "./actions/hour-actions"
import { getDateRange } from "./utils/view-helpers"
import { getHolidaysInRange } from "../(admin)/admin/holidays/actions/holiday-actions"
import { SetBreadcrumbData } from "@/features/breadcrumbs/set-breadcrumb-data"
import type { ViewMode } from "./schemas/hour-filter-schemas"

export const dynamic = "force-dynamic"

interface HoursPageProps {
    searchParams: Promise<{ view?: string; date?: string }>
}

export default async function HoursPage({ searchParams }: HoursPageProps) {
    const session = await getServerSession(authConfig)
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const params = await searchParams
    const viewMode = (params.view?.toUpperCase() as ViewMode) || "WEEKLY"
    const selectedDate = params.date ? new Date(params.date) : new Date()

    const cookieStore = await cookies()
    const expandedTypesCookie = cookieStore.get("hours-expanded-types")
    const initialExpandedTypes = expandedTypesCookie?.value
        ? JSON.parse(expandedTypesCookie.value)
        : []

    const dateRange = getDateRange(viewMode, selectedDate)
    const weekRange = getDateRange("WEEKLY", selectedDate)
    const monthRange = getDateRange("MONTHLY", selectedDate)

    const [entries, weeklyEntries, monthlyEntries, holidays, t] = await Promise.all([
        getHourEntries(dateRange.startDate, dateRange.endDate),
        getHourEntries(weekRange.startDate, weekRange.endDate),
        getHourEntries(monthRange.startDate, monthRange.endDate),
        getHolidaysInRange(monthRange.startDate, monthRange.endDate),
        getTranslations("navigation"),
    ])

    return (
        <>
            <SetBreadcrumbData data={{ "/hours": t("hours") }} />
            <HoursView
                initialEntries={entries}
                initialWeeklyEntries={weeklyEntries}
                initialMonthlyEntries={monthlyEntries}
                userId={session.user.id}
                initialViewMode={viewMode}
                initialSelectedDate={selectedDate}
                initialHolidays={holidays}
                initialDateRange={monthRange}
                initialExpandedTypes={initialExpandedTypes}
            />
        </>
    )
}
