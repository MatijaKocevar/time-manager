import { PrismaClient } from "@/../prisma/generated/client"

const prisma = new PrismaClient()

async function recalculateSummaries() {
    console.log("=== Recalculating DailyHourSummary from TaskTimeEntry ===\n")

    const taskTimeEntries = await prisma.taskTimeEntry.findMany({
        where: {
            endTime: { not: null },
            duration: { not: null },
        },
        orderBy: { startTime: "asc" },
    })

    console.log(`Found ${taskTimeEntries.length} completed time entries\n`)

    const dateTypeUserMap = new Map<string, { userId: string; date: Date; type: string }>()

    for (const entry of taskTimeEntries) {
        const entryDate = new Date(entry.startTime)
        entryDate.setUTCHours(0, 0, 0, 0)

        const approvedRemoteRequest = await prisma.request.findFirst({
            where: {
                userId: entry.userId,
                status: "APPROVED",
                affectsHourType: true,
                startDate: { lte: entryDate },
                endDate: { gte: entryDate },
            },
        })

        const hourType = approvedRemoteRequest ? "WORK_FROM_HOME" : "WORK"
        const key = `${entry.userId}-${entryDate.toISOString()}-${hourType}`

        dateTypeUserMap.set(key, {
            userId: entry.userId,
            date: entryDate,
            type: hourType,
        })
    }

    console.log(`Processing ${dateTypeUserMap.size} unique date/type/user combinations\n`)

    let processed = 0
    for (const [, { userId, date, type }] of dateTypeUserMap.entries()) {
        await prisma.$transaction(async (tx) => {
            const normalizedDate = new Date(date)
            normalizedDate.setUTCHours(0, 0, 0, 0)

            const manualAggregate = await tx.hourEntry.aggregate({
                where: {
                    userId,
                    date: normalizedDate,
                    type: type as "WORK" | "WORK_FROM_HOME",
                    taskId: null,
                },
                _sum: {
                    hours: true,
                },
            })

            const startOfDay = new Date(normalizedDate)
            const endOfDay = new Date(normalizedDate)
            endOfDay.setUTCDate(endOfDay.getUTCDate() + 1)

            const trackedAggregate = await tx.taskTimeEntry.aggregate({
                where: {
                    userId,
                    startTime: {
                        gte: startOfDay,
                        lt: endOfDay,
                    },
                    endTime: { not: null },
                    duration: { not: null },
                },
                _sum: {
                    duration: true,
                },
            })

            const manualHours = manualAggregate._sum.hours || 0
            const trackedHours = (trackedAggregate._sum.duration || 0) / 3600
            const totalHours = manualHours + trackedHours

            await tx.dailyHourSummary.upsert({
                where: {
                    userId_date_type: {
                        userId,
                        date: normalizedDate,
                        type: type as "WORK" | "WORK_FROM_HOME",
                    },
                },
                create: {
                    userId,
                    date: normalizedDate,
                    type: type as "WORK" | "WORK_FROM_HOME",
                    manualHours,
                    trackedHours,
                    totalHours,
                },
                update: {
                    manualHours,
                    trackedHours,
                    totalHours,
                },
            })
        })

        processed++
        if (processed % 10 === 0) {
            console.log(`Processed ${processed}/${dateTypeUserMap.size}`)
        }
    }

    console.log(`\n✓ Recalculated ${processed} summaries successfully`)

    const finalSummaries = await prisma.dailyHourSummary.findMany({
        where: {
            trackedHours: { gt: 0 },
        },
        orderBy: [{ date: "desc" }, { type: "asc" }],
    })

    console.log(`\n=== Summaries with Tracked Hours ===\n`)
    console.table(
        finalSummaries.map((s) => ({
            date: s.date.toISOString().split("T")[0],
            type: s.type,
            manualHours: s.manualHours.toFixed(2),
            trackedHours: s.trackedHours.toFixed(2),
            totalHours: s.totalHours.toFixed(2),
        }))
    )
}

recalculateSummaries()
    .catch((error) => {
        console.error("Error recalculating summaries:", error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
