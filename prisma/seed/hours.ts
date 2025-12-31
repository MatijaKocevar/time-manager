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
    const approvedRequests = await prisma.request.findMany({
        where: {
            userId,
            status: "APPROVED",
            affectsHourType: true,
            startDate: { lte: endDate },
            endDate: { gte: startDate },
        },
        select: {
            startDate: true,
            endDate: true,
            type: true,
            skipWeekends: true,
            skipHolidays: true,
        },
    })

    const requestDateMap = new Map<string, string>()
    for (const req of approvedRequests) {
        for (const date of dateRange(req.startDate, req.endDate)) {
            const dayOfWeek = date.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
            const isHoliday = holidays.some((h) => h.getTime() === date.getTime())

            if ((req.skipWeekends && isWeekend) || (req.skipHolidays && isHoliday)) continue

            const dateKey = normalizeDate(date).toISOString().split("T")[0]
            requestDateMap.set(dateKey, req.type)
        }
    }

    const entries = []

    for (const date of dateRange(startDate, endDate)) {
        if (!isWeekday(date)) continue
        if (holidays.some((h) => h.getTime() === date.getTime())) continue

        const dateKey = normalizeDate(date).toISOString().split("T")[0]
        if (requestDateMap.has(dateKey)) continue

        if (random.next() > 0.3) continue

        const rand = random.next()
        let type: HourType
        if (rand < 0.8) type = "WORK"
        else if (rand < 0.95) type = "WORK_FROM_HOME"
        else type = "OTHER"

        const hours = random.nextInt(1, 3)
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
