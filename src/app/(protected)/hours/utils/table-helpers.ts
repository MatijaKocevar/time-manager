import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import { HOUR_TYPES } from "../constants/hour-types"

export function generateDateColumns(startDate: string, endDate: string): Date[] {
    const [startYear, startMonth, startDay] = startDate.split("-").map(Number)
    const [endYear, endMonth, endDay] = endDate.split("-").map(Number)

    const start = new Date(startYear, startMonth - 1, startDay)
    const end = new Date(endYear, endMonth - 1, endDay)
    const dates = []
    const current = new Date(start)

    while (current <= end) {
        dates.push(new Date(current))
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
        if (!grouped[entry.type]) {
            grouped[entry.type] = {}
        }
        grouped[entry.type][dateKey] = entry
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

export function getTypeLabel(type: string): string {
    return HOUR_TYPES.find((t) => t.value === type)?.label || type
}

const TYPE_COLORS: Record<string, string> = {
    WORK: "bg-blue-100 text-blue-800",
    VACATION: "bg-green-100 text-green-800",
    SICK_LEAVE: "bg-red-100 text-red-800",
    WORK_FROM_HOME: "bg-purple-100 text-purple-800",
    OTHER: "bg-gray-100 text-gray-800",
}

export function getTypeColor(type: string): string {
    return TYPE_COLORS[type] || TYPE_COLORS.OTHER
}
