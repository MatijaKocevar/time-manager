import { PrismaClient, HourType } from "../generated/client"
import { SeededRandom, normalizeDate, dateRange, isWeekday, addDays } from "./utils"
import { refreshDailyHourSummary } from "../../src/lib/materialized-views"

export async function seedHourEntriesForUser(
    prisma: PrismaClient,
    random: SeededRandom,
    userId: string,
    tasks: Array<{ id: string }>,
    startDate: Date,
    endDate: Date,
    holidays: Date[]
) {
    const entries = []

    for (const date of dateRange(startDate, endDate)) {
        if (!isWeekday(date)) continue
        if (holidays.some((h) => h.getTime() === date.getTime())) continue

        if (random.next() > 0.7) continue

        const rand = random.next()
        let type: HourType
        if (rand < 0.8) type = "WORK"
        else if (rand < 0.9) type = "WORK_FROM_HOME"
        else if (rand < 0.95) type = "VACATION"
        else type = random.choice(["SICK_LEAVE", "OTHER"] as HourType[])

        const hours = random.nextInt(4, 10)
        const isTaskLinked = random.next() < 0.3 && tasks.length > 0

        entries.push({
            userId,
            date: normalizeDate(date),
            hours,
            type,
            description: isTaskLinked ? null : `Manual ${type} entry`,
            taskId: isTaskLinked ? random.choice(tasks).id : null,
        })
    }

    for (const entry of entries) {
        try {
            await prisma.hourEntry.create({ data: entry })
        } catch {
            // Skip duplicates
        }
    }

    return entries.length
}

export async function recalculateSummariesForUser(
    prisma: PrismaClient,
    userId: string,
    startDate: Date,
    endDate: Date
) {
    await refreshDailyHourSummary()
    return 0
}
