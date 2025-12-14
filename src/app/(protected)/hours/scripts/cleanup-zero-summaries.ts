import { prisma } from "@/lib/prisma"

async function cleanupZeroHourSummaries() {
    console.log("Cleaning up zero-hour WORK summaries...")

    const decemberStart = new Date("2025-12-01")
    const decemberEnd = new Date("2025-12-31")

    const result = await prisma.dailyHourSummary.deleteMany({
        where: {
            date: {
                gte: decemberStart,
                lte: decemberEnd,
            },
            type: "WORK",
            totalHours: 0,
        },
    })

    console.log(`Deleted ${result.count} zero-hour WORK summaries`)
    console.log("\n✓ Cleanup complete!")
}

cleanupZeroHourSummaries()
    .then(() => {
        console.log("Done!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Error:", error)
        process.exit(1)
    })
