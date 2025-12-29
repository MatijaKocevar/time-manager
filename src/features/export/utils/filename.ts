import type { ExportFormat } from "../schemas"

export function generateFilename(
    prefix: string,
    startDate: string,
    endDate: string,
    format: ExportFormat,
    userName?: string
): string {
    const start = startDate.replace(/-/g, "")
    const end = endDate.replace(/-/g, "")
    const userPart = userName ? `-${userName.replace(/\s+/g, "-")}` : ""
    const extension = format === "excel" ? "xlsx" : format

    if (start === end) {
        return `${prefix}${userPart}-${start}.${extension}`
    }

    return `${prefix}${userPart}-${start}-${end}.${extension}`
}

export function getMimeType(format: ExportFormat): string {
    switch (format) {
        case "csv":
            return "text/csv"
        case "excel":
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        case "json":
            return "application/json"
    }
}

export function formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

export function formatDateTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toISOString()
}
