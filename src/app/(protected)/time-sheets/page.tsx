import { TimeSheetsView } from "./_components/time-sheets-view"
import { getHolidaysInRange } from "../admin/holidays/_actions/holiday-actions"
import { getDateRangeForView } from "./_utils/date-helpers"

interface TimeSheetsPageProps {
    searchParams: Promise<{ mode?: string; date?: string; filter?: string }>
}

export default async function TimeSheetsPage({ searchParams }: TimeSheetsPageProps) {
    const params = await searchParams
    const selectedDate = params.date ? new Date(params.date) : new Date()

    const monthRange = getDateRangeForView(selectedDate, "month")

    const holidays = await getHolidaysInRange(
        monthRange.startDate.toISOString(),
        monthRange.endDate.toISOString()
    )

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex-1 overflow-hidden">
                <TimeSheetsView searchParams={params} initialHolidays={holidays} />
            </div>
        </div>
    )
}
