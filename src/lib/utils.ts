import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toZonedTime } from "date-fns-tz"

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

export function getTodayDate(): Date {
    const nowInLjubljana = toZonedTime(new Date(), APP_TIMEZONE)
    return new Date(
        Date.UTC(
            nowInLjubljana.getFullYear(),
            nowInLjubljana.getMonth(),
            nowInLjubljana.getDate()
        )
    )
}
