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

        let rowKey: string
        if (entry.taskId === "total") {
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

export function getTypeLabel(type: string): string {
    if (type.endsWith("_TRACKED")) {
        const baseType = type.replace("_TRACKED", "")
        const baseLabel = HOUR_TYPES.find((t) => t.value === baseType)?.label || baseType
        return `${baseLabel} (Tracked)`
    }
    if (type.endsWith("_MANUAL")) {
        const baseType = type.replace("_MANUAL", "")
        const baseLabel = HOUR_TYPES.find((t) => t.value === baseType)?.label || baseType
        return `${baseLabel} (Manual)`
    }
    if (type.endsWith("_TOTAL")) {
        const baseType = type.replace("_TOTAL", "")
        const baseLabel = HOUR_TYPES.find((t) => t.value === baseType)?.label || baseType
        return `${baseLabel} (Total)`
    }
    return HOUR_TYPES.find((t) => t.value === type)?.label || type
}

const TYPE_COLORS: Record<string, string> = {
    WORK: "bg-blue-100 text-blue-800",
    WORK_TRACKED: "bg-blue-100 text-blue-800",
    WORK_MANUAL: "bg-blue-50 text-blue-700",
    WORK_TOTAL: "bg-blue-200 text-blue-900",
    VACATION: "bg-green-100 text-green-800",
    VACATION_TRACKED: "bg-green-100 text-green-800",
    VACATION_MANUAL: "bg-green-50 text-green-700",
    VACATION_TOTAL: "bg-green-200 text-green-900",
    SICK_LEAVE: "bg-red-100 text-red-800",
    SICK_LEAVE_TRACKED: "bg-red-100 text-red-800",
    SICK_LEAVE_MANUAL: "bg-red-50 text-red-700",
    SICK_LEAVE_TOTAL: "bg-red-200 text-red-900",
    WORK_FROM_HOME: "bg-purple-100 text-purple-800",
    WORK_FROM_HOME_TRACKED: "bg-purple-100 text-purple-800",
    WORK_FROM_HOME_MANUAL: "bg-purple-50 text-purple-700",
    WORK_FROM_HOME_TOTAL: "bg-purple-200 text-purple-900",
    OTHER: "bg-gray-100 text-gray-800",
    OTHER_TRACKED: "bg-gray-100 text-gray-800",
    OTHER_MANUAL: "bg-gray-50 text-gray-700",
    OTHER_TOTAL: "bg-gray-200 text-gray-900",
}

export function getTypeColor(type: string): string {
    return TYPE_COLORS[type] || TYPE_COLORS.OTHER
}

const ROW_BG_COLORS: Record<string, string> = {
    WORK_TOTAL: "bg-blue-500/10 dark:bg-blue-500/15",
    WORK_TRACKED: "bg-blue-500/5 dark:bg-blue-500/10",
    WORK_MANUAL: "bg-blue-500/5 dark:bg-blue-500/10",
    VACATION_TOTAL: "bg-green-500/10 dark:bg-green-500/15",
    VACATION_TRACKED: "bg-green-500/5 dark:bg-green-500/10",
    VACATION_MANUAL: "bg-green-500/5 dark:bg-green-500/10",
    SICK_LEAVE_TOTAL: "bg-red-500/10 dark:bg-red-500/15",
    SICK_LEAVE_TRACKED: "bg-red-500/5 dark:bg-red-500/10",
    SICK_LEAVE_MANUAL: "bg-red-500/5 dark:bg-red-500/10",
    WORK_FROM_HOME_TOTAL: "bg-purple-500/10 dark:bg-purple-500/15",
    WORK_FROM_HOME_TRACKED: "bg-purple-500/5 dark:bg-purple-500/10",
    WORK_FROM_HOME_MANUAL: "bg-purple-500/5 dark:bg-purple-500/10",
    OTHER_TOTAL: "bg-gray-500/10 dark:bg-gray-500/15",
    OTHER_TRACKED: "bg-gray-500/5 dark:bg-gray-500/10",
    OTHER_MANUAL: "bg-gray-500/5 dark:bg-gray-500/10",
}

export function getRowBgColor(type: string): string {
    return ROW_BG_COLORS[type] || ""
}
