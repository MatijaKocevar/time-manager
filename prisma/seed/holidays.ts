import { PrismaClient } from "../generated/client"
import { normalizeDate } from "./utils"

export async function seedHolidays(prisma: PrismaClient): Promise<Date[]> {
    console.log("\nSeeding holidays...")

    const currentYear = new Date().getFullYear()
    const years = [currentYear - 1, currentYear, currentYear + 1]

    for (const year of years) {
        try {
            const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/SI`)

            if (response.ok) {
                const holidays = await response.json()

                for (const holiday of holidays) {
                    const date = new Date(holiday.date + "T00:00:00Z")

                    await prisma.holiday.upsert({
                        where: { date },
                        update: {},
                        create: {
                            date,
                            name: holiday.name,
                            description:
                                holiday.localName !== holiday.name ? holiday.localName : null,
                            isRecurring: true,
                        },
                    })
                }

                console.log(`Imported holidays for Slovenia ${year}`)
            }
        } catch (error) {
            console.warn(`Failed to fetch holidays for ${year}:`, error)
        }
    }

    const holidays = await prisma.holiday.findMany()
    const holidayDates = holidays.map((h) => normalizeDate(h.date))
    console.log(`Loaded ${holidayDates.length} holidays`)

    return holidayDates
}
