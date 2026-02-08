import { getTranslations } from "next-intl/server"
import { TimeSheetsClient } from "./time-sheets-client"
import { TimeEntriesDialog } from "../../tasks/components/time-entries-dialog"
import { DayEntriesDialog } from "./day-entries-dialog"
import { getTimeSheetEntries } from "../actions/time-sheet-actions"
import { getDateRangeForView, type ViewMode } from "../utils/date-helpers"
import { getCurrentUser } from "../../profile/actions/profile-actions"
import { aggregateTimeEntriesByTaskAndDate } from "../utils/aggregation-helpers"
import { calculateExpectedHoursToDate, calculateBalance } from "@/lib/balance-helpers"

interface TimeSheetsViewProps {
    searchParams: { mode?: string; date?: string }
    initialHolidays?: Array<{ date: Date; name: string }>
}

export async function TimeSheetsView({ searchParams, initialHolidays = [] }: TimeSheetsViewProps) {
    const t = await getTranslations("timeSheets")
    const tSummary = await getTranslations("hours.summary")
    const tDialog = await getTranslations("timeSheets.dayEntriesDialog")

    const viewMode = (searchParams.mode === "month" ? "month" : "week") as ViewMode
    const selectedDate = searchParams.date ? new Date(searchParams.date) : new Date()

    const dateRange = getDateRangeForView(selectedDate, viewMode)
    const result = await getTimeSheetEntries({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
    })

    const initialData = "data" in result && result.data ? result.data : []

    const currentUser = await getCurrentUser()
    const userWorkHoursPerDay = currentUser?.workHoursPerDay || 8

    const aggregatedData = aggregateTimeEntriesByTaskAndDate(
        initialData,
        dateRange.dates,
        new Date()
    )
    const totalSeconds = Array.from(aggregatedData.dailyTotals.values()).reduce(
        (sum, daily) => sum + daily,
        0
    )

    const expectedHours = calculateExpectedHoursToDate(
        dateRange.startDate,
        dateRange.endDate,
        initialHolidays,
        userWorkHoursPerDay
    )

    const balance = calculateBalance(totalSeconds, expectedHours)

    return (
        <>
            <TimeSheetsClient
                initialData={initialData}
                initialViewMode={viewMode}
                initialSelectedDate={selectedDate}
                initialHolidays={initialHolidays}
                userWorkHoursPerDay={userWorkHoursPerDay}
                initialBalance={balance}
                initialExpectedHours={expectedHours}
                translations={{
                    week: t("viewMode.week"),
                    month: t("viewMode.month"),
                    task: t("table.task"),
                    total: tSummary("total"),
                    dailyTotal: t("table.dailyTotal"),
                    overtime: t("table.overtime"),
                    undertime: t("table.undertime"),
                    noData: t("messages.noData"),
                    loading: t("messages.loading"),
                    error: t("messages.error"),
                }}
            />
            <TimeEntriesDialog />
            <DayEntriesDialog
                translations={{
                    title: tDialog("title"),
                    description: tDialog("description"),
                    startedAt: tDialog("startedAt"),
                    endedAt: tDialog("endedAt"),
                    duration: tDialog("duration"),
                    task: tDialog("task"),
                    active: tDialog("active"),
                    noEntries: tDialog("noEntries"),
                    close: tDialog("close"),
                }}
            />
        </>
    )
}
