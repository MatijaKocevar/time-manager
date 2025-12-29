import type { Holiday } from "../schemas"

export function getUpcomingHolidays(holidays: Holiday[]): Holiday[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return holidays
        .filter((holiday) => holiday.date >= today)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function formatHolidayDate(date: Date, locale: string): string {
    return date.toLocaleDateString(locale, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

export function formatRequestDateRange(startDate: Date, endDate: Date, locale: string): string {
    const formatOptions: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }

    const start = startDate.toLocaleDateString(locale, formatOptions)
    const end = endDate.toLocaleDateString(locale, formatOptions)

    return `${start} - ${end}`
}
