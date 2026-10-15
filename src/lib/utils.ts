import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toZonedTime, fromZonedTime } from "date-fns-tz"

export const APP_TIMEZONE = "Europe/Ljubljana"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDateToLocal(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

export function parseDateStringAsLocal(dateString: string): Date {
    const [year, month, day] = dateString.split("-").map(Number)
    return new Date(year, month - 1, day)
}

export function getTodayDate(timeZone: string = APP_TIMEZONE): Date {
    const nowInZone = toZonedTime(new Date(), timeZone)
    return new Date(Date.UTC(nowInZone.getFullYear(), nowInZone.getMonth(), nowInZone.getDate()))
}

export function getDayBoundsInTimeZone(
    timeZone: string,
    reference: Date = new Date()
): { start: Date; end: Date; dateKey: string } {
    const wall = toZonedTime(reference, timeZone)
    const year = wall.getFullYear()
    const month = wall.getMonth()
    const day = wall.getDate()

    const start = fromZonedTime(new Date(year, month, day, 0, 0, 0, 0), timeZone)
    const end = fromZonedTime(new Date(year, month, day + 1, 0, 0, 0, 0), timeZone)
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

    return { start, end, dateKey }
}
