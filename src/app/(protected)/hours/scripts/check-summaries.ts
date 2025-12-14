import { prisma } from "@/lib/prisma"

async function checkSummaries() {
    console.log("Checking DailyHourSummary records...\n")

    const summaries = await prisma.dailyHourSummary.findMany({
        where: {
            date: {
                gte: new Date("2025-12-01"),
                lte: new Date("2025-12-31"),
            },
        },
        orderBy: [{ date: "desc" }, { type: "asc" }],
    })

    console.log(`Found ${summaries.length} summary records for December 2025:\n`)

    const summaryByDate = new Map<string, typeof summaries>()
    summaries.forEach((s) => {
        const dateKey = s.date.toISOString().split("T")[0]
        if (!summaryByDate.has(dateKey)) {
            summaryByDate.set(dateKey, [])
        }
        summaryByDate.get(dateKey)!.push(s)
    })

    summaryByDate.forEach((daySummaries, dateKey) => {
        console.log(`\n${dateKey}:`)
        daySummaries.forEach((s) => {
            console.log(
                `  ${s.type.padEnd(20)} - Manual: ${s.manualHours.toFixed(2)}h, Tracked: ${s.trackedHours.toFixed(2)}h, Total: ${s.totalHours.toFixed(2)}h`
            )
        })
    })

    const trackedSummaries = summaries.filter((s) => s.trackedHours > 0)
    console.log(`\n\nSummaries with tracked hours (${trackedSummaries.length}):`)
    trackedSummaries.forEach((s) => {
        console.log(
            `  ${s.date.toISOString().split("T")[0]} - ${s.type}: ${s.trackedHours.toFixed(2)}h tracked`
        )
    })
}

checkSummaries()
    .catch((error) => {
        console.error("Check failed:", error)
        process.exit(1)
    })
    .finally(() => {
        prisma.$disconnect()
    })
