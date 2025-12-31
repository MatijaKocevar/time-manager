export function formatHoursToTime(hours: number): string {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

export function formatHoursMinutes(hours: number): string {
    const isNegative = hours < 0
    const absHours = Math.abs(hours)
    const h = Math.floor(absHours)
    const m = Math.round((absHours - h) * 60)
    const sign = isNegative ? "-" : ""
    if (m === 0) return `${sign}${h}h`
    return `${sign}${h}h ${m}m`
}

export function parseDuration(input: string): number | null {
    const match = input.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return null

    const hours = parseInt(match[1])
    const minutes = parseInt(match[2])

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0 || minutes > 59) {
        return null
    }

    return hours + minutes / 60
}
