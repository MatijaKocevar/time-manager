import { getShiftsForPeriod, getAllUsers } from "./actions/shift-actions"
import { ShiftsCalendar } from "./components/shifts-calendar"
import { ShiftLegend } from "./components/shift-legend"

export default async function ShiftsPage() {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const [shiftsResult, usersResult] = await Promise.all([
        getShiftsForPeriod({ startDate: startOfWeek, endDate: endOfWeek }),
        getAllUsers(),
    ])

    if (shiftsResult.error || usersResult.error) {
        return (
            <div className="flex flex-col gap-4 h-full">
                <h1 className="text-2xl font-bold">Shifts</h1>
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
            <div className="flex items-center justify-between shrink-0">
                <h1 className="text-2xl font-bold">Shifts</h1>
            </div>
            <div className="shrink-0">
                <ShiftLegend />
            </div>
            <div className="flex-1 min-h-0">
                <ShiftsCalendar initialShifts={shiftsWithParsedDates} users={users} />
            </div>
        </div>
    )
}
