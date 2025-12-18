import { PrismaClient, HourType } from "../generated/client"
import { SeededRandom, normalizeDate, dateRange, isWeekday, addDays } from "./utils"

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

export async function recalculateDailySummary(
    tx: Omit<
        PrismaClient,
        "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >,
    userId: string,
    date: Date,
    type: HourType
) {
    const normalizedDate = normalizeDate(date)
    const nextDay = addDays(normalizedDate, 1)

    const manualAggregate = await tx.hourEntry.aggregate({
        where: {
            userId,
            date: { gte: normalizedDate, lt: nextDay },
            type,
            taskId: null,
        },
        _sum: { hours: true },
    })

    const dateUTC = normalizeDate(date)
    const approvedRequest = await tx.request.findFirst({
        where: {
            userId,
            status: "APPROVED",
            affectsHourType: true,
            startDate: { lte: dateUTC },
            endDate: { gte: dateUTC },
            cancelledAt: null,
        },
        orderBy: { approvedAt: "desc" },
    })

    let trackedHourType: HourType = "WORK"
    if (approvedRequest) {
        switch (approvedRequest.type) {
            case "VACATION":
                trackedHourType = "VACATION"
                break
            case "SICK_LEAVE":
                trackedHourType = "SICK_LEAVE"
                break
            case "WORK_FROM_HOME":
                trackedHourType = "WORK_FROM_HOME"
                break
            case "OTHER":
                trackedHourType = "OTHER"
                break
        }
    }

    let trackedHours = 0
    if (type === trackedHourType) {
        const trackedAggregate = await tx.taskTimeEntry.aggregate({
            where: {
                userId,
                startTime: { gte: normalizedDate, lt: nextDay },
                endTime: { not: null },
                duration: { not: null },
            },
            _sum: { duration: true },
        })
        trackedHours = (trackedAggregate._sum.duration || 0) / 3600
    }

    const manualHours = manualAggregate._sum.hours || 0
    const totalHours = manualHours + trackedHours

    if (totalHours === 0) {
        await tx.dailyHourSummary.deleteMany({
            where: { userId, date: normalizedDate, type },
        })
    } else {
        await tx.dailyHourSummary.upsert({
            where: {
                userId_date_type: { userId, date: normalizedDate, type },
            },
            create: { userId, date: normalizedDate, type, manualHours, trackedHours, totalHours },
            update: { manualHours, trackedHours, totalHours },
        })
    }
}

export async function recalculateSummariesForUser(
    prisma: PrismaClient,
    userId: string,
    startDate: Date,
    endDate: Date
) {
    const hourTypes: HourType[] = ["WORK", "VACATION", "SICK_LEAVE", "WORK_FROM_HOME", "OTHER"]
    let summariesCreated = 0

    const dates = Array.from(dateRange(startDate, endDate))
    const batchSize = 7

    for (let i = 0; i < dates.length; i += batchSize) {
        const batch = dates.slice(i, i + batchSize)

        await prisma.$transaction(async (tx) => {
            for (const date of batch) {
                for (const type of hourTypes) {
                    await recalculateDailySummary(tx, userId, date, type)
                    summariesCreated++
                }
            }
        })
    }

    return summariesCreated
}
