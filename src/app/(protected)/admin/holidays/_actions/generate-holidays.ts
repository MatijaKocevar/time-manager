"use server"

import { startOfDay } from "@/lib/date-utils"
import { prisma } from "@/lib/prisma"

interface PublicHoliday {
    date: string
    localName: string
    name: string
    countryCode: string
    global: boolean
}

export async function fetchPublicHolidays(
    year: number,
    countryCode: string = "US"
): Promise<PublicHoliday[]> {
    try {
        const response = await fetch(
            `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`,
            { signal: AbortSignal.timeout(10000) }
        )

        if (!response.ok) {
            const errorMsg = `HTTP ${response.status}: ${response.statusText}`
            throw new Error(`Failed to fetch holidays: ${errorMsg}`)
        }

        const holidays: PublicHoliday[] = await response.json()
        return holidays
    } catch (error) {
        throw error
    }
}

export async function importHolidaysFromAPI(year: number, countryCode: string = "US") {
    try {
        const holidays = await fetchPublicHolidays(year, countryCode)

        if (holidays.length === 0) {
            return { success: false, error: "No holidays found", created: 0 }
        }

        let created = 0

        for (const holiday of holidays) {
            const date = startOfDay(new Date(holiday.date + "T00:00:00"))

            const existing = await prisma.holiday.findUnique({
                where: { date },
            })

            if (!existing) {
                await prisma.holiday.create({
                    data: {
                        date,
                        name: holiday.name,
                        description: holiday.localName !== holiday.name ? holiday.localName : null,
                        isRecurring: true,
                    },
                })
                created++
            }
        }

        return {
            success: true,
            created,
            message: `Imported ${created} holidays for ${year}`,
            error: null,
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMsg, created: 0 }
    }
}

export async function autoGenerateUpcomingHolidays(countryCode: string = "US") {
    try {
        const currentYear = new Date().getFullYear()
        const nextYear = currentYear + 1

        const currentYearResult = await importHolidaysFromAPI(currentYear, countryCode)
        const nextYearResult = await importHolidaysFromAPI(nextYear, countryCode)

        const errors = []
        if (!currentYearResult.success && currentYearResult.error) {
            errors.push(`${currentYear}: ${currentYearResult.error}`)
        }
        if (!nextYearResult.success && nextYearResult.error) {
            errors.push(`${nextYear}: ${nextYearResult.error}`)
        }

        const total = (currentYearResult.created || 0) + (nextYearResult.created || 0)

        if (errors.length > 0) {
            const errorMsg = errors.join(" | ")
            return {
                success: false,
                error: errorMsg,
                currentYear: currentYearResult,
                nextYear: nextYearResult,
                total,
            }
        }

        return {
            success: true,
            currentYear: currentYearResult,
            nextYear: nextYearResult,
            total,
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        return {
            success: false,
            error: errorMsg,
            currentYear: { success: false, error: errorMsg, created: 0 },
            nextYear: { success: false, error: errorMsg, created: 0 },
            total: 0,
        }
    }
}
