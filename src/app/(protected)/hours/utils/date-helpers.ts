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

export function parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number)
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    return date
}

export function parseEndDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number)
    const date = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
    return date
}

export function buildHolidayMap(
    holidays: Array<{ date: Date; name: string }>
): Map<string, { name: string }> {
    const map = new Map<string, { name: string }>()
    holidays.forEach((holiday) => {
        const holidayDate = new Date(holiday.date)
        const key = formatDateKey(holidayDate)
        map.set(key, { name: holiday.name })
    })
    return map
}
