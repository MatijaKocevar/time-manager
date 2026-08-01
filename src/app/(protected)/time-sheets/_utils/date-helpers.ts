export {
    formatDateKey,
    isToday,
    isWeekend,
    generateDateRange,
    buildHolidayMap,
    getHolidayForDate,
} from "@/lib/date-utils"
import { generateDateRange } from "@/lib/date-utils"

import { startOfDay, endOfDay } from "@/lib/date-utils"

export type ViewMode = "week" | "month"

export interface DateRangeInfo {
    startDate: Date
    endDate: Date
    title: string
    dates: Date[]
}

export function getDateRangeForView(date: Date, mode: ViewMode): DateRangeInfo {
    if (mode === "week") {
        return getWeekRange(date)
    }
    return getMonthRange(date)
}

export function getWeekRange(date: Date): DateRangeInfo {
    const current = new Date(date)
    const dayOfWeek = current.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

    const monday = startOfDay(new Date(current))
    monday.setDate(current.getDate() + diff)

    const sunday = endOfDay(new Date(monday))
    sunday.setDate(monday.getDate() + 6)

    const dates = generateDateRange(monday, sunday)

    const startMonth = monday.toLocaleDateString("en-US", { month: "short" })
    const endMonth = sunday.toLocaleDateString("en-US", { month: "short" })
    const startDay = monday.getDate()
    const endDay = sunday.getDate()

    const title = `${startMonth} ${startDay} - ${endMonth} ${endDay}`

    return {
        startDate: monday,
        endDate: sunday,
        title,
        dates,
    }
}

export function getMonthRange(date: Date): DateRangeInfo {
    const year = date.getFullYear()
    const month = date.getMonth()

    const startDate = new Date(year, month, 1, 0, 0, 0, 0)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)

    const dates = generateDateRange(startDate, endDate)

    const title = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })

    return {
        startDate,
        endDate,
        title,
        dates,
    }
}

export function formatDateHeader(date: Date): string {
    const day = date.getDate()
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" })
    return `${weekday} ${day}`
}

export function countWorkingDays(dates: Date[]): number {
    return dates.filter((date) => {
        const day = date.getDay()
        return day !== 0 && day !== 6
    }).length
}
