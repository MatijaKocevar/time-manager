import type { ViewMode } from "../schemas/hour-filter-schemas"

export function getDateRange(mode: ViewMode, referenceDate: Date = new Date()) {
    const start = new Date(referenceDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(referenceDate)
    end.setHours(0, 0, 0, 0)

    switch (mode) {
        case "WEEKLY":
            const dayOfWeek = start.getDay()
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            start.setDate(start.getDate() - daysToMonday)
            end.setTime(start.getTime())
            end.setDate(end.getDate() + 6)
            break
        case "MONTHLY":
            start.setDate(1)
            end.setMonth(end.getMonth() + 1, 0)
            break
        case "DAILY":
            break
        case "YEARLY":
            start.setMonth(0, 1)
            end.setMonth(11, 31)
            break
    }

    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    return {
        start,
        end,
        startDate: formatDate(start),
        endDate: formatDate(end),
    }
}

export function getViewTitle(
    mode: ViewMode,
    dateRange: { start: Date; end: Date },
    currentDate: Date,
    locale: string = "en"
): string {
    const localeMap: Record<string, string> = {
        en: "en-US",
        sl: "sl-SI",
    }
    const dateLocale = localeMap[locale] || "en-US"

    if (mode === "WEEKLY") {
        const start = dateRange.start
        const end = dateRange.end
        return `${start.toLocaleDateString(dateLocale, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(dateLocale, { month: "short", day: "numeric" })}`
    } else if (mode === "MONTHLY") {
        return currentDate.toLocaleDateString(dateLocale, { month: "long", year: "numeric" })
    } else if (mode === "DAILY") {
        return currentDate.toLocaleDateString(dateLocale, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        })
    } else {
        return currentDate.toLocaleDateString(dateLocale, { year: "numeric" })
    }
}

export function calculateWorkingDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    let count = 0

    const current = new Date(start)
    while (current <= end) {
        const day = current.getDay()
        if (day !== 0 && day !== 6) {
            count++
        }
        current.setDate(current.getDate() + 1)
    }

    return count
}
