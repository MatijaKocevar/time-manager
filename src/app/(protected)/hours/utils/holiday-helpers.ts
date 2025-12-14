import { prisma } from "@/lib/prisma"

export async function getHolidaysInRange(startDate: Date, endDate: Date) {
    try {
        const holidays = await prisma.holiday.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        })
        return holidays
    } catch (error) {
        console.error("Error fetching holidays:", error)
        return []
    }
}

export async function isHoliday(date: Date): Promise<boolean> {
    try {
        const normalizedDate = new Date(date)
        normalizedDate.setHours(0, 0, 0, 0)

        const holiday = await prisma.holiday.findUnique({
            where: { date: normalizedDate },
        })

        return holiday !== null
    } catch (error) {
        console.error("Error checking holiday:", error)
        return false
    }
}

export function isHolidayFromList(date: Date, holidays: Array<{ date: Date }>): boolean {
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)
    const dateTime = normalizedDate.getTime()

    return holidays.some((holiday) => {
        const holidayDate = new Date(holiday.date)
        holidayDate.setHours(0, 0, 0, 0)
        return holidayDate.getTime() === dateTime
    })
}

export async function calculateWorkingDays(
    startDate: Date,
    endDate: Date,
    excludeHolidays = true
): Promise<number> {
    const start = new Date(startDate)
    const end = new Date(endDate)
    let count = 0

    const holidays = excludeHolidays ? await getHolidaysInRange(start, end) : []

    const current = new Date(start)
    while (current <= end) {
        const day = current.getDay()
        const isWeekend = day === 0 || day === 6

        if (!isWeekend) {
            const isHol = isHolidayFromList(current, holidays)
            if (!isHol) {
                count++
            }
        }

        current.setDate(current.getDate() + 1)
    }

    return count
}

export function calculateWorkingDaysSync(
    startDate: Date,
    endDate: Date,
    holidays: Array<{ date: Date }> = []
): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    let count = 0

    const current = new Date(start)
    while (current <= end) {
        const day = current.getDay()
        const isWeekend = day === 0 || day === 6

        if (!isWeekend) {
            const isHol = isHolidayFromList(current, holidays)
            if (!isHol) {
                count++
            }
        }

        current.setDate(current.getDate() + 1)
    }

    return count
}
