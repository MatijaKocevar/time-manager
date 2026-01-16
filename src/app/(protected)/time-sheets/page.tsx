import { TimeSheetsView } from "./components/time-sheets-view"
import { getHolidaysInRange } from "../admin/holidays/actions/holiday-actions"
import { getDateRangeForView } from "./utils/date-helpers"

interface TimeSheetsPageProps {
    searchParams: Promise<{ mode?: string; date?: string }>
}

export default async function TimeSheetsPage({ searchParams }: TimeSheetsPageProps) {
    const params = await searchParams
    const viewMode = params.mode === "month" ? "month" : "week"
    const selectedDate = params.date ? new Date(params.date) : new Date()
    const dateRange = getDateRangeForView(selectedDate, viewMode)

    const holidays = await getHolidaysInRange(
        dateRange.startDate.toISOString(),
        dateRange.endDate.toISOString()
    )

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex-1 overflow-hidden">
                <TimeSheetsView searchParams={params} initialHolidays={holidays} />
            </div>
        </div>
    )
}
