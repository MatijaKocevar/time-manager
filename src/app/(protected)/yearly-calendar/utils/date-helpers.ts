export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate()
}

export function isValidDate(year: number, month: number, day: number): boolean {
    const daysInMonth = getDaysInMonth(year, month)
    return day <= daysInMonth
}

export function getMonthNames(locale: string): string[] {
    const formatter = new Intl.DateTimeFormat(locale, { month: "long" })
    return Array.from({ length: 12 }, (_, i) => {
        const date = new Date(2000, i, 1)
        return formatter.format(date)
    })
}

export function createDateKey(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Date(year, month - 1, day)
}
