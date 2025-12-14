import { prisma } from "@/lib/prisma"

async function debugWorkSummaries() {
    console.log("Checking WORK summaries in December...")

    const decemberStart = new Date("2025-12-01")
    const decemberEnd = new Date("2025-12-31")

    const workSummaries = await prisma.dailyHourSummary.findMany({
        where: {
            date: {
                gte: decemberStart,
                lte: decemberEnd,
            },
            type: "WORK",
        },
        orderBy: { date: "asc" },
    })

    console.log(`\nFound ${workSummaries.length} WORK summaries\n`)

    for (const summary of workSummaries) {
        const dateStr = summary.date.toISOString().split("T")[0]
        console.log(
            `${dateStr}: manual=${summary.manualHours}h tracked=${summary.trackedHours}h total=${summary.totalHours}h`
        )

        // Check for corresponding hour entries
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

        if (hourEntries.length > 0) {
            console.log(
                `  Found ${hourEntries.length} entries:`,
                hourEntries.map((e) => `${e.type}(${e.hours}h)`).join(", ")
            )
        }

        // Check for tracked time
        const trackedEntries = await prisma.taskTimeEntry.findMany({
            where: {
                userId: summary.userId,
                startTime: {
                    gte: dayStart,
                    lt: dayEnd,
                },
                endTime: { not: null },
            },
        })

        if (trackedEntries.length > 0) {
            const totalSeconds = trackedEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
            console.log(
                `  Found ${trackedEntries.length} tracked entries: ${(totalSeconds / 3600).toFixed(2)}h total`
            )
        }
    }
}

debugWorkSummaries()
    .then(() => {
        console.log("\nDone!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Error:", error)
        process.exit(1)
    })
