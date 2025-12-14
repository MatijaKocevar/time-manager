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
                },
            })

            let hourType: HourType = "WORK"
            if (approvedRequest) {
                switch (approvedRequest.type) {
                    case "VACATION":
                        hourType = "VACATION"
                        break
                    case "SICK_LEAVE":
                        hourType = "SICK_LEAVE"
                        break
                    case "WORK_FROM_HOME":
                    case "REMOTE_WORK":
                        hourType = "WORK_FROM_HOME"
                        break
                    case "OTHER":
                        hourType = "OTHER"
                        break
                }
            }
            const key = `${dateLocal.toISOString()}-${hourType}`
            uniqueCombinations.add(key)
        }

        console.log(`Found ${uniqueCombinations.size} unique date/type combinations`)

        let processed = 0
        for (const key of uniqueCombinations) {
            const [dateStr, type] =
                key.split("-WORK").length > 1
                    ? [key.substring(0, key.lastIndexOf("-")), "WORK"]
                    : key.split("-VACATION").length > 1
                      ? [key.substring(0, key.lastIndexOf("-")), "VACATION"]
                      : key.split("-SICK_LEAVE").length > 1
                        ? [key.substring(0, key.lastIndexOf("-")), "SICK_LEAVE"]
                        : key.split("-WORK_FROM_HOME").length > 1
                          ? [key.substring(0, key.lastIndexOf("-")), "WORK_FROM_HOME"]
                          : [key.substring(0, key.lastIndexOf("-")), "OTHER"]

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
