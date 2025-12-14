import { prisma } from "@/lib/prisma"

async function checkWorkSummariesWithHours() {
    const workSummaries = await prisma.dailyHourSummary.findMany({
        where: {
            date: {
                gte: new Date("2025-12-01"),
                lte: new Date("2025-12-31"),
            },
            type: "WORK",
            totalHours: {
                gt: 0,
            },
        },
        orderBy: { date: "asc" },
    })

    console.log(`Found ${workSummaries.length} WORK summaries with hours:\n`)

    for (const summary of workSummaries) {
        const dateStr = summary.date.toISOString().split("T")[0]
        console.log(`${dateStr}: manual=${summary.manualHours}h tracked=${summary.trackedHours}h`)

        const dayStart = new Date(summary.date)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(summary.date)
        dayEnd.setHours(23, 59, 59, 999)

        const hourEntries = await prisma.hourEntry.findMany({
            where: {
                userId: summary.userId,
                date: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
        })

        console.log(`  Hour entries (${hourEntries.length}):`)
        hourEntries.forEach((e) => {
            console.log(`    ${e.type}: ${e.hours}h, taskId=${e.taskId}, id=${e.id}`)
        })
        console.log()
    }
}

checkWorkSummariesWithHours()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error)
        process.exit(1)
    })
