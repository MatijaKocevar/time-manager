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

export function parsePeriodStartDate(period: string): Date {
    const match = period.match(/(\d{2})\.(\d{2})\.(\d{4})/)
    if (match) {
        const [, day, month, year] = match
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }
    return new Date(0)
}

export function getStatusColor(status: string): string {
    if (status.includes("Confirmed") && !status.includes("cancel")) return "text-green-600"
    if (status.includes("Rejected") || status.includes("cancel")) return "text-red-600"
    return "text-muted-foreground"
}
