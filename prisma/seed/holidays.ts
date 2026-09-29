import { PrismaClient } from "../generated/client"
import { getNonWorkFreeNameSets, getWorkFreeHolidays } from "../../src/lib/si-holidays"
import { normalizeDate } from "./utils"

function holidayDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Date(Date.UTC(year, month - 1, day))
}

export async function seedHolidays(prisma: PrismaClient): Promise<Date[]> {
    try {
        console.log("\nSeeding holidays...")

        const currentYear = new Date().getFullYear()
        const years = [currentYear - 1, currentYear, currentYear + 1]

        const nonWorkFreeNames = getNonWorkFreeNameSets()

        const removed = await prisma.holiday.deleteMany({
            where: {
                OR: [
                    { name: { in: [...nonWorkFreeNames.english] } },
                    { description: { in: [...nonWorkFreeNames.slovenian] } },
                ],
            },
        })

        if (removed.count > 0) {
            console.log(`  ✓ Removed ${removed.count} non-work-free holidays`)
        }

        for (const year of years) {
            const holidays = getWorkFreeHolidays(year)

            for (const holiday of holidays) {
                const date = holidayDate(holiday.date)

                await prisma.holiday.upsert({
                    where: { date },
                    update: {
                        name: holiday.nameEn,
                        description: holiday.nameSl !== holiday.nameEn ? holiday.nameSl : null,
                        isRecurring: true,
                    },
                    create: {
                        date,
                        name: holiday.nameEn,
                        description: holiday.nameSl !== holiday.nameEn ? holiday.nameSl : null,
                        isRecurring: true,
                    },
                })
            }

            console.log(`  ✓ Seeded ${holidays.length} work-free days for ${year}`)
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
