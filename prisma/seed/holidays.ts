import { PrismaClient } from "../generated/client"
import { normalizeDate } from "./utils"

export async function seedHolidays(prisma: PrismaClient): Promise<Date[]> {
    try {
        console.log("\nSeeding holidays...")

        const currentYear = new Date().getFullYear()
        const years = [currentYear - 1, currentYear, currentYear + 1]

        for (const year of years) {
            try {
                console.log(`  Fetching holidays for ${year}...`)
                const response = await fetch(
                    `https://date.nager.at/api/v3/PublicHolidays/${year}/SI`,
                    {
                        signal: AbortSignal.timeout(10000),
                    }
                )

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

                    console.log(`  ✓ Imported holidays for Slovenia ${year}`)
                } else {
                    console.warn(
                        `  ⚠️  Failed to fetch holidays for ${year}: HTTP ${response.status}`
                    )
                }
            } catch (error) {
                console.error(`❌ Failed to fetch holidays for ${year}:`, error)
                if (error instanceof Error) {
                    console.error(`   Error message: ${error.message}`)
                    console.error(`   Error stack: ${error.stack}`)
                }
            }
        }

        const holidays = await prisma.holiday.findMany()
        const holidayDates = holidays.map((h) => normalizeDate(h.date))
        console.log(`✓ Loaded ${holidayDates.length} holidays total\n`)

        return holidayDates
    } catch (error) {
        console.error("❌ seedHolidays function failed completely:", error)
        if (error instanceof Error) {
            console.error(`   Error: ${error.message}`)
            console.error(`   Stack: ${error.stack}`)
        }
        return []
    }
}
