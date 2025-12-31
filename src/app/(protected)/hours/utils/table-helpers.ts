import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import { HOUR_TYPE_COLORS, ROW_BG_COLORS } from "../constants/hour-types"

export function generateDateColumns(startDate: string, endDate: string): Date[] {
    const [startYear, startMonth, startDay] = startDate.split("-").map(Number)
    const [endYear, endMonth, endDay] = endDate.split("-").map(Number)

    const start = new Date(startYear, startMonth - 1, startDay)
    const end = new Date(endYear, endMonth - 1, endDay)
    const dates = []
    const current = new Date(start)

    while (current <= end) {
        dates.push(new Date(current.getTime()))
        current.setDate(current.getDate() + 1)
    }

    return dates
}

export function groupEntriesByType(
    entries: HourEntryDisplay[]
): Record<string, Record<string, HourEntryDisplay>> {
    const grouped: Record<string, Record<string, HourEntryDisplay>> = {}

    entries.forEach((entry) => {
        let dateKey: string
        if (entry.date instanceof Date) {
            const year = entry.date.getFullYear()
            const month = String(entry.date.getMonth() + 1).padStart(2, "0")
            const day = String(entry.date.getDate()).padStart(2, "0")
            dateKey = `${year}-${month}-${day}`
        } else {
            dateKey = entry.date
        }

        let rowKey: string
        if (entry.taskId === "grand_total") {
            rowKey = "GRAND_TOTAL"
        } else if (entry.taskId === "total") {
            rowKey = `${entry.type}_TOTAL`
        } else if (entry.taskId === "tracked") {
            rowKey = `${entry.type}_TRACKED`
        } else {
            rowKey = `${entry.type}_MANUAL`
        }

        if (!grouped[rowKey]) {
            grouped[rowKey] = {}
        }

        if (!grouped[rowKey][dateKey]) {
            grouped[rowKey][dateKey] = entry
        } else {
            grouped[rowKey][dateKey] = {
                ...grouped[rowKey][dateKey],
                hours: grouped[rowKey][dateKey].hours + entry.hours,
            }
        }
    })

    return grouped
}

export function formatEntryDate(date: Date | string): string {
    if (date instanceof Date) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }
    return date
}

export function getTypeColor(type: string): string {
    const colorKey = type as keyof typeof HOUR_TYPE_COLORS
    return HOUR_TYPE_COLORS[colorKey] || HOUR_TYPE_COLORS.OTHER
}

export function getRowBgColor(type: string): string {
    const colorKey = type as keyof typeof ROW_BG_COLORS
    return ROW_BG_COLORS[colorKey] || ""
}
