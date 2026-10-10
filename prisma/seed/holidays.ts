import { PrismaClient } from "../generated/client"
import { syncWorkFreeHolidays } from "../../src/lib/holiday-sync"
import { normalizeDate } from "./utils"

export async function seedHolidays(prisma: PrismaClient): Promise<Date[]> {
    try {
        console.log("\nSeeding holidays...")

        const currentYear = new Date().getFullYear()
        const years = [currentYear - 1, currentYear, currentYear + 1]

        const result = await syncWorkFreeHolidays(prisma, years)

        console.log(
            `  ✓ Holidays synced (${result.created} created, ${result.updated} updated, ${result.removed} removed, ${result.normalized} normalized)`
        )

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
