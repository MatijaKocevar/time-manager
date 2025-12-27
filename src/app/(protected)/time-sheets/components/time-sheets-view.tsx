import { getTranslations } from "next-intl/server"
import { TimeSheetsClient } from "./time-sheets-client"
import { TimeEntriesDialog } from "../../tasks/components/time-entries-dialog"
import { getTimeSheetEntries } from "../actions/time-sheet-actions"
import { getDateRangeForView, type ViewMode } from "../utils/date-helpers"

interface TimeSheetsViewProps {
    searchParams: { mode?: string; date?: string }
}

export async function TimeSheetsView({ searchParams }: TimeSheetsViewProps) {
    const t = await getTranslations("timeSheets")
    const tSummary = await getTranslations("hours.summary")

    const viewMode = (searchParams.mode === "month" ? "month" : "week") as ViewMode
    const selectedDate = searchParams.date ? new Date(searchParams.date) : new Date()

    const dateRange = getDateRangeForView(selectedDate, viewMode)
    const result = await getTimeSheetEntries({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
    })

    const initialData = "data" in result && result.data ? result.data : []

    return (
        <>
            <TimeSheetsClient
                initialData={initialData}
                initialViewMode={viewMode}
                initialSelectedDate={selectedDate}
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
        </>
    )
}
