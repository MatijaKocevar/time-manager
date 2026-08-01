export function startOfDay(date: Date): Date {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
}

export function endOfDay(date: Date): Date {
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
}

export function formatDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

export function isToday(date: Date): boolean {
    const today = new Date()
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    )
}

export function isWeekend(date: Date): boolean {
    const day = date.getDay()
    return day === 0 || day === 6
}

export function generateDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = []
    const current = new Date(start)
    while (current <= end) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }
    return dates
}

export function isHolidayFromList(date: Date, holidays: Array<{ date: Date }>): boolean {
    const normalizedDate = startOfDay(date)
    const dateTime = normalizedDate.getTime()
    return holidays.some((holiday) => {
        const holidayDate = startOfDay(new Date(holiday.date))
        return holidayDate.getTime() === dateTime
    })
}

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
        const isWeekendDay = day === 0 || day === 6

        if (!isWeekendDay) {
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

export function buildHolidayMap(
    holidays: Array<{ date: Date; name: string }> | undefined
): Map<string, { name: string }> {
    const map = new Map<string, { name: string }>()
    if (!holidays) return map
    holidays.forEach((holiday) => {
        const key = formatDateKey(new Date(holiday.date))
        map.set(key, { name: holiday.name })
    })
    return map
}

export function getHolidayForDate(
    date: Date,
    holidaysByDate: Map<string, { name: string }>
): { name: string } | undefined {
    const key = formatDateKey(date)
    return holidaysByDate.get(key)
}
