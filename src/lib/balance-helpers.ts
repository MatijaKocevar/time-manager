export function calculateWorkingDays(
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
            const isHoliday = holidays.some((holiday) => {
                const holidayDate = new Date(holiday.date)
                return (
                    holidayDate.getFullYear() === current.getFullYear() &&
                    holidayDate.getMonth() === current.getMonth() &&
                    holidayDate.getDate() === current.getDate()
                )
            })

            if (!isHoliday) {
                count++
            }
        }

        current.setDate(current.getDate() + 1)
    }

    return count
}

export function calculateExpectedHours(
    startDate: Date,
    endDate: Date,
    holidays: Array<{ date: Date }>,
    hoursPerDay: number
): number {
    const workingDays = calculateWorkingDays(startDate, endDate, holidays)
    return workingDays * hoursPerDay
}

export function calculateExpectedHoursToDate(
    startDate: Date,
    endDate: Date,
    holidays: Array<{ date: Date }>,
    hoursPerDay: number
): number {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(endDate)
    const periodEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate())

    const effectiveEndDate = today < periodEnd ? today : periodEnd

    return calculateExpectedHours(startDate, effectiveEndDate, holidays, hoursPerDay)
}

export function calculateBalance(workedSeconds: number, expectedHours: number): number {
    const workedHours = workedSeconds / 3600
    return workedHours - expectedHours
}

export function formatBalance(balanceHours: number): string {
    const sign = balanceHours >= 0 ? "+" : "-"
    const absHours = Math.abs(balanceHours)
    let hours = Math.floor(absHours)
    let minutes = Math.round((absHours - hours) * 60)

    if (minutes === 60) {
        hours++
        minutes = 0
    }

    return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

export function formatHoursMinutes(seconds: number): string {
    const totalHours = seconds / 3600
    let hours = Math.floor(totalHours)
    let minutes = Math.round((totalHours - hours) * 60)

    if (minutes === 60) {
        hours++
        minutes = 0
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

export function getBalanceColor(balanceHours: number): string {
    if (Math.abs(balanceHours) < 0.25) {
        return "text-green-600 dark:text-green-500"
    }
    if (balanceHours > 0) {
        return "text-red-600 dark:text-red-500"
    }
    return "text-orange-600 dark:text-orange-500"
}
