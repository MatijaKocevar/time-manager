export function formatDuration(seconds: number): string {
    if (seconds < 0) return "0s"

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
        return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`
    } else {
        return `${secs}s`
    }
}

export function formatDurationLong(seconds: number): string {
    if (seconds < 0) return "0 seconds"

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts: string[] = []
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`)
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`)
    if (secs > 0 || parts.length === 0)
        parts.push(`${secs} ${secs === 1 ? "second" : "seconds"}`)

    return parts.join(", ")
}

export function getElapsedSeconds(startTime: Date): number {
    const now = new Date()
    return Math.floor((now.getTime() - startTime.getTime()) / 1000)
}

export function calculateTotalTime(durations: (number | null)[]): number {
    return durations.reduce((sum: number, duration) => sum + (duration || 0), 0)
}

export function formatTime(date: Date): string {
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })
}

export function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

export function formatDateTime(date: Date): string {
    return `${formatDate(date)} ${formatTime(date)}`
}
