import { getTranslations } from "next-intl/server"
import { getShiftsForPeriod, getAllUsers } from "./actions/shift-actions"
import { getHolidaysInRange } from "../admin/holidays/actions/holiday-actions"
import { ShiftsCalendar } from "./components/shifts-calendar"

export const dynamic = "force-dynamic"

type ViewMode = "week" | "month"

interface ShiftsPageProps {
    searchParams: Promise<{ view?: string; date?: string }>
}

export default async function ShiftsPage({ searchParams }: ShiftsPageProps) {
    const params = await searchParams
    const viewMode = (params.view as ViewMode) || "week"
    const selectedDate = params.date ? new Date(params.date) : new Date()

    const { startDate, endDate } = getDateRange(viewMode, selectedDate)

    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    const [shiftsResult, usersResult, holidays, t, tShifts] = await Promise.all([
        getShiftsForPeriod({ startDate, endDate }),
        getAllUsers(),
        getHolidaysInRange(formatDate(startDate), formatDate(endDate)),
        getTranslations("navigation"),
        getTranslations("shifts.messages"),
    ])

    if (shiftsResult.error || usersResult.error) {
        return (
            <div className="flex flex-col gap-4 h-full">
                <div className="text-red-500">
                    {tShifts("failedToLoad", {
                        error: shiftsResult.error || usersResult.error || "Unknown error",
                    })}
                </div>
            </div>
        )
    }

    const shifts = shiftsResult.shifts || []
    const users = usersResult.users || []

    const shiftsWithNormalizedDates = shifts.map((shift) => {
        const date = new Date(shift.date)
        const year = date.getUTCFullYear()
        const month = String(date.getUTCMonth() + 1).padStart(2, "0")
        const day = String(date.getUTCDate()).padStart(2, "0")
        return {
            ...shift,
            dateString: `${year}-${month}-${day}`,
        }
    })

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex-1 min-h-0">
                <ShiftsCalendar
                    initialShifts={shiftsWithNormalizedDates}
                    users={users}
                    initialHolidays={holidays}
                    initialViewMode={viewMode}
                    initialSelectedDate={selectedDate}
                />
            </div>
        </div>
    )
}

function getDateRange(viewMode: ViewMode, date: Date) {
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0)

    if (viewMode === "week") {
        const dayOfWeek = selectedDate.getDay()
        const startDate = new Date(selectedDate)
        startDate.setDate(selectedDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
        startDate.setHours(0, 0, 0, 0)

        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)

        return { startDate, endDate }
    } else {
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)

        const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)

        return { startDate, endDate }
    }
}
