import { prisma } from "@/lib/prisma"
import { recalculateDailySummaryStandalone } from "../utils/summary-helpers"

async function fixStaleSummaries() {
    console.log("Fixing stale WORK summaries...")

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
    })

    console.log(`Found ${workSummaries.length} WORK summaries to recalculate\n`)

    for (const summary of workSummaries) {
        const dateStr = summary.date.toISOString().split("T")[0]
        console.log(`Recalculating ${dateStr}...`)
        
        await recalculateDailySummaryStandalone(summary.userId, summary.date, "WORK")
    }

    // Now delete any zero-hour WORK summaries
    const deleteResult = await prisma.dailyHourSummary.deleteMany({
        where: {
            date: {
                gte: new Date("2025-12-01"),
                lte: new Date("2025-12-31"),
            },
            type: "WORK",
            totalHours: 0,
        },
    })

    console.log(`\nDeleted ${deleteResult.count} zero-hour summaries`)
    console.log("\n✓ Fix complete!")
}

fixStaleSummaries()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error)
        process.exit(1)
    })
