import { prisma } from "@/lib/prisma"
import { recalculateDailySummaryStandalone } from "../utils/summary-helpers"

type HourType = "WORK" | "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "OTHER"

async function syncDailySummaries() {
    console.log("Starting daily summary sync...")

    const users = await prisma.user.findMany({
        select: { id: true },
    })

    for (const user of users) {
        console.log(`Syncing summaries for user ${user.id}...`)

        const hourEntries = await prisma.hourEntry.findMany({
            where: { userId: user.id },
            select: { date: true, type: true },
        })

        const taskTimeEntries = await prisma.taskTimeEntry.findMany({
            where: { userId: user.id, duration: { not: null } },
            select: { startTime: true },
        })

        const uniqueCombinations = new Set<string>()

        for (const entry of hourEntries) {
            const date = new Date(entry.date)
            date.setHours(0, 0, 0, 0)
            const key = `${date.toISOString()}-${entry.type}`
            uniqueCombinations.add(key)
        }

        for (const entry of taskTimeEntries) {
            const date = new Date(entry.startTime)
            const dateLocal = new Date(date)
            dateLocal.setHours(0, 0, 0, 0)
            const dateUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

            const approvedRequest = await prisma.request.findFirst({
                where: {
                    userId: user.id,
                    status: "APPROVED",
                    affectsHourType: true,
                    startDate: { lte: dateUTC },
                    endDate: { gte: dateUTC },
                    cancelledAt: null,
                },
                orderBy: {
                    approvedAt: "desc",
                },
            })

            const hourType: HourType = approvedRequest?.type ?? "WORK"
            const key = `${dateLocal.toISOString()}-${hourType}`
            uniqueCombinations.add(key)
        }

        console.log(`Found ${uniqueCombinations.size} unique date/type combinations`)

        let processed = 0
        for (const key of uniqueCombinations) {
            const lastDashIndex = key.lastIndexOf("-")
            const dateStr = key.substring(0, lastDashIndex)
            const type = key.substring(lastDashIndex + 1) as HourType
            const date = new Date(dateStr)

            try {
                await recalculateDailySummaryStandalone(user.id, date, type as HourType)
                processed++

                if (processed % 10 === 0) {
                    console.log(`Processed ${processed}/${uniqueCombinations.size}`)
                }
            } catch (error) {
                console.error(`Error processing ${key}:`, error)
            }
        }

        console.log(`Completed sync for user ${user.id} (${processed} summaries)`)
    }

    console.log("Daily summary sync completed!")
}

syncDailySummaries()
    .catch((error) => {
        console.error("Sync failed:", error)
        process.exit(1)
    })
    .finally(() => {
        prisma.$disconnect()
    })
