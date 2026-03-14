import type { PendingUrnikNetRequest } from "../schemas/urnik-net-requests-schemas"

export interface UrnikNetRequest {
    no: string
    requestDate: string
    requestType: string
    period: string
    days: string
    hours: string
    pPrihod: string
    arrival: string
    arrivalRequests: string
    pOdhod: string
    departure: string
    departureRequests: string
    oldSchedule: string
    newSchedule: string
    status: string
    confirmedBy: string
    notes: string
    hasActions: boolean
}

export type RequestRow =
    | { type: "pending"; data: PendingUrnikNetRequest }
    | { type: "existing"; data: UrnikNetRequest }

export function parsePeriodStartDate(period: string): Date {
    const match = period.match(/(\d{2})\.(\d{2})\.(\d{4})/)
    if (match) {
        const [, day, month, year] = match
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }
    return new Date(0)
}

export function buildExistingRequestDates(requests: UrnikNetRequest[]): Set<string> {
    const dates = new Set<string>()
    for (const req of requests) {
        try {
            const statusLower = req.status.toLowerCase()
            if (statusLower.includes("cancel") || statusLower.includes("reject")) continue

            const hasHours = req.hours && req.hours.trim() !== "" && req.hours !== "0"
            const hasArrival = req.arrival && req.arrival.trim() !== ""
            const hasDeparture = req.departure && req.departure.trim() !== ""
            if (!hasHours && !hasArrival && !hasDeparture) continue

            const rangeMatch = req.period.match(
                /(\d{2})\.(\d{2})\.(\d{4})-(\d{2})\.(\d{2})\.(\d{4})/
            )
            if (rangeMatch) {
                const [, day1, month1, year1, day2, month2, year2] = rangeMatch
                const start = new Date(parseInt(year1), parseInt(month1) - 1, parseInt(day1))
                const end = new Date(parseInt(year2), parseInt(month2) - 1, parseInt(day2))
                const current = new Date(start)
                while (current <= end) {
                    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`
                    dates.add(dateStr)
                    current.setDate(current.getDate() + 1)
                }
            } else {
                const singleMatch = req.period.match(/(\d{2})\.(\d{2})\.(\d{4})/)
                if (singleMatch) {
                    const [, day, month, year] = singleMatch
                    dates.add(`${year}-${month}-${day}`)
                }
            }
        } catch {
            // Skip invalid period formats
        }
    }
    return dates
}

export function mergeAndSortRows(
    pending: PendingUrnikNetRequest[],
    existing: UrnikNetRequest[],
    existingDates: Set<string>
): RequestRow[] {
    const filteredPending = pending.filter((req) => {
        const year = req.date.getFullYear()
        const month = String(req.date.getMonth() + 1).padStart(2, "0")
        const day = String(req.date.getDate()).padStart(2, "0")
        return !existingDates.has(`${year}-${month}-${day}`)
    })

    const rows: RequestRow[] = [
        ...filteredPending.map((req) => ({ type: "pending" as const, data: req })),
        ...existing.map((req) => ({ type: "existing" as const, data: req })),
    ]

    rows.sort((a, b) => {
        const dateA = a.type === "pending" ? a.data.date : parsePeriodStartDate(a.data.period)
        const dateB = b.type === "pending" ? b.data.date : parsePeriodStartDate(b.data.period)
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime()
        }
        if (a.type === "pending" && b.type === "existing") return -1
        if (a.type === "existing" && b.type === "pending") return 1
        return 0
    })

    return rows
}

export function getStatusColor(status: string): string {
    if (status.includes("Confirmed") && !status.includes("cancel")) return "text-green-600"
    if (status.includes("Rejected") || status.includes("cancel")) return "text-red-600"
    return "text-muted-foreground"
}
