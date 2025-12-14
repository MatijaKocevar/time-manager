import { getShiftsForPeriod, getAllUsers } from "./actions/shift-actions"
import { getHolidaysInRange } from "../(admin)/admin/holidays/actions/holiday-actions"
import { ShiftsCalendar } from "./components/shifts-calendar"

export default async function ShiftsPage() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfWeek = new Date(today)
    const dayOfWeek = today.getDay()
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    endOfMonth.setHours(23, 59, 59, 999)

    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    const [shiftsResult, usersResult, holidays] = await Promise.all([
        getShiftsForPeriod({ startDate: startOfWeek, endDate: endOfWeek }),
        getAllUsers(),
        getHolidaysInRange(formatDate(startOfWeek), formatDate(endOfMonth)),
    ])

    if (shiftsResult.error || usersResult.error) {
        return (
            <div className="flex flex-col gap-4 h-full">
                <div className="text-red-500">
                    Failed to load shifts: {shiftsResult.error || usersResult.error}
                </div>
            </div>
        )
    }

    const shifts = shiftsResult.shifts || []
    const users = usersResult.users || []

    const shiftsWithParsedDates = shifts.map((shift) => ({
        ...shift,
        date: new Date(shift.date),
    }))

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex-1 min-h-0">
                <ShiftsCalendar
                    initialShifts={shiftsWithParsedDates}
                    users={users}
                    initialHolidays={holidays}
                />
            </div>
        </div>
    )
}
