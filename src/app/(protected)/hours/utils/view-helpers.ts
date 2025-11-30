import type { ViewMode } from "../schemas/hour-filter-schemas"

export function getDateRange(mode: ViewMode, referenceDate: Date = new Date()) {
    const start = new Date(referenceDate)
    const end = new Date(referenceDate)

    switch (mode) {
        case "WEEKLY":
            const dayOfWeek = start.getDay()
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            start.setDate(start.getDate() - daysToMonday)
            end.setDate(start.getDate() + 6)
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
    currentDate: Date
): string {
    if (mode === "WEEKLY") {
        const start = dateRange.start
        const end = dateRange.end
        return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    } else if (mode === "MONTHLY") {
        return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    } else if (mode === "DAILY") {
        return currentDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        })
    } else {
        return currentDate.toLocaleDateString("en-US", { year: "numeric" })
    }
}
