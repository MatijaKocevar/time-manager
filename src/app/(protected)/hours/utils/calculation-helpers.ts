import { isHolidayFromList } from "./holiday-helpers"

export function calculateWorkingDaysSync(
    startDate: Date,
    endDate: Date,
    holidays: Array<{ date: Date }> = []
): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    let count = 0

    const current = new Date(start)
    while (current <= end) {
        const day = current.getDay()
        const isWeekend = day === 0 || day === 6

        if (!isWeekend) {
            const isHol = isHolidayFromList(current, holidays)
            if (!isHol) {
                count++
            }
        }

        current.setDate(current.getDate() + 1)
    }

    return count
}

export function calculateOvertime(totalHours: number, workingDays: number): number {
    const expectedHours = workingDays * 8
    return totalHours - expectedHours
}
