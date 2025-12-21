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

    const monday = new Date(current)
    monday.setDate(current.getDate() + diff)
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const dates = generateDateRange(monday, sunday)

    const startMonth = monday.toLocaleDateString("en-US", { month: "short" })
    const endMonth = sunday.toLocaleDateString("en-US", { month: "short" })
    const startDay = monday.getDate()
    const endDay = sunday.getDate()

    let title: string
    if (startMonth === endMonth) {
        title = `${startMonth} ${startDay} - ${endDay}`
    } else {
        title = `${startMonth} ${startDay} - ${endMonth} ${endDay}`
    }

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

function generateDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = []
    const current = new Date(start)

    while (current <= end) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }

    return dates
}

export function isWeekend(date: Date): boolean {
    const day = date.getDay()
    return day === 0 || day === 6
}

export function isToday(date: Date): boolean {
    const today = new Date()
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    )
}

export function formatDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
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
