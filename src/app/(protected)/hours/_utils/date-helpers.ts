export { formatDateKey, isToday, buildHolidayMap, getHolidayForDate } from "@/lib/date-utils"

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
