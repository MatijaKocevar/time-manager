"use server"

import { prisma } from "@/lib/prisma"

interface PublicHoliday {
    date: string
    localName: string
    name: string
    countryCode: string
    global: boolean
}

export async function fetchPublicHolidays(year: number, countryCode: string = "US") {
    try {
        const response = await fetch(
            `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`
        )

        if (!response.ok) {
            throw new Error("Failed to fetch holidays")
        }

        const holidays: PublicHoliday[] = await response.json()
        return holidays
    } catch (error) {
        console.error("Error fetching holidays:", error)
        return []
    }
}

export async function importHolidaysFromAPI(year: number, countryCode: string = "US") {
    const holidays = await fetchPublicHolidays(year, countryCode)

    if (holidays.length === 0) {
        return { success: false, error: "No holidays found or API error", created: 0 }
    }

    let created = 0

    for (const holiday of holidays) {
        const date = new Date(holiday.date + "T00:00:00")
        date.setHours(0, 0, 0, 0)

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

    return { success: true, created, message: `Imported ${created} holidays for ${year}` }
}

export async function autoGenerateUpcomingHolidays(countryCode: string = "US") {
    const currentYear = new Date().getFullYear()
    const nextYear = currentYear + 1

    const currentYearResult = await importHolidaysFromAPI(currentYear, countryCode)
    const nextYearResult = await importHolidaysFromAPI(nextYear, countryCode)

    return {
        success: true,
        currentYear: currentYearResult,
        nextYear: nextYearResult,
        total: (currentYearResult.created || 0) + (nextYearResult.created || 0),
    }
}
