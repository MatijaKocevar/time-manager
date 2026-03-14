export function formatMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
    }).format(date)
}

export function getPreviousMonth(currentMonth: string): string {
    const [year, month] = currentMonth.split("-").map(Number)
    const date = new Date(year, month - 1, 1)
    date.setMonth(date.getMonth() - 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function getNextMonth(currentMonth: string): string {
    const [year, month] = currentMonth.split("-").map(Number)
    const date = new Date(year, month - 1, 1)
    date.setMonth(date.getMonth() + 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}
