import { prisma } from "./src/lib/prisma"

async function checkSummaries() {
    const summaries = await prisma.dailyHourSummary.findMany({
        where: {
            date: {
                gte: new Date(2025, 10, 1),
                lte: new Date(2025, 10, 30),
            },
            type: "WORK",
        },
        orderBy: {
            date: "asc",
        },
    })

    console.log(`Found ${summaries.length} summaries for November 2025 WORK type`)
    for (const summary of summaries) {
        console.log(
            `Date: ${summary.date.toISOString().split("T")[0]}, Manual: ${summary.manualHours}, Tracked: ${summary.trackedHours}, Total: ${summary.totalHours}`
        )
    }

    const manualEntries = await prisma.hourEntry.findMany({
        where: {
            date: {
                gte: new Date(2025, 10, 1),
                lte: new Date(2025, 10, 30),
            },
            type: "WORK",
            taskId: null,
        },
        orderBy: {
            date: "asc",
        },
    })

    console.log(`\nFound ${manualEntries.length} manual entries for November 2025 WORK type`)
    for (const entry of manualEntries) {
        console.log(
            `Date: ${entry.date.toISOString()}, Hours: ${entry.hours}, Normalized: ${new Date(entry.date).setHours(0, 0, 0, 0)}`
        )
    }

    console.log("\nChecking one specific date calculation:")
    const testDate = new Date(2025, 10, 3)
    testDate.setHours(0, 0, 0, 0)
    console.log(`Test date (Nov 3): ${testDate.toISOString()}`)

    const manualForDate = await prisma.hourEntry.aggregate({
        where: {
            userId: summaries[0]?.userId,
            date: testDate,
            type: "WORK",
            taskId: null,
        },
        _sum: {
            hours: true,
        },
    })
    console.log(`Manual hours for Nov 3: ${manualForDate._sum.hours}`)

    await prisma.$disconnect()
}

checkSummaries()
