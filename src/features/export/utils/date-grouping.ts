import type { MonthlyGroupedData } from "../types"

export function groupDataByMonth<T extends { date: string }>(
    data: T[]
): MonthlyGroupedData<T>[] {
    const grouped = new Map<string, T[]>()

    for (const item of data) {
        const date = new Date(item.date)
        const year = date.getFullYear()
        const month = date.getMonth()
        const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`

        if (!grouped.has(monthKey)) {
            grouped.set(monthKey, [])
        }
        grouped.get(monthKey)!.push(item)
    }

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]

    return Array.from(grouped.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthKey, data]) => {
            const [year, month] = monthKey.split("-").map(Number)
            return {
                monthKey,
                monthLabel: `${monthNames[month - 1]} ${year}`,
                year,
                month,
                data,
            }
        })
}

export function isWeekCrossingMonths(startDate: Date, endDate: Date): boolean {
    return startDate.getMonth() !== endDate.getMonth()
}

export function getWeekIdentifier(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

export function getMonthIdentifier(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    return `${year}-${month}`
}
