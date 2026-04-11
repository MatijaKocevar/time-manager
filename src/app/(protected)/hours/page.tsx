import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { HoursView } from "./components/hours-view"
import { getHourEntries, getUserPreferences, getAttendanceData } from "./actions/hour-actions"
import { getDateRange } from "./utils/view-helpers"
import { getHolidaysInRange } from "../admin/holidays/actions/holiday-actions"
import type { ViewMode } from "./schemas/hour-filter-schemas"
import { VIEW_MODE_VALUES } from "./schemas/hour-filter-schemas"

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
    const preferences = await getUserPreferences()

    const viewMode =
        (params.view?.toUpperCase() as ViewMode) ||
        (preferences.hoursViewMode.toUpperCase() as ViewMode) ||
        VIEW_MODE_VALUES.WEEKLY
    const selectedDate = params.date ? new Date(params.date) : new Date()

    const dateRange = getDateRange(viewMode, selectedDate)
    const weekRange = getDateRange(VIEW_MODE_VALUES.WEEKLY, selectedDate)
    const monthRange = getDateRange(VIEW_MODE_VALUES.MONTHLY, selectedDate)

    const [entries, weeklyEntries, monthlyEntries, holidays, attendanceData] = await Promise.all([
        getHourEntries(dateRange.startDate, dateRange.endDate),
        getHourEntries(weekRange.startDate, weekRange.endDate),
        getHourEntries(monthRange.startDate, monthRange.endDate),
        getHolidaysInRange(monthRange.startDate, monthRange.endDate),
        getAttendanceData(monthRange.startDate, monthRange.endDate),
    ])

    return (
        <HoursView
            initialEntries={entries}
            initialWeeklyEntries={weeklyEntries}
            initialMonthlyEntries={monthlyEntries}
            userId={session.user.id}
            initialViewMode={viewMode}
            initialSelectedDate={selectedDate}
            initialHolidays={holidays}
            initialDateRange={monthRange}
            initialSummaryCollapsed={preferences.hoursCardCollapsed}
            initialAttendanceData={attendanceData}
        />
    )
}
