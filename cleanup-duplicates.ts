import { prisma } from "./src/lib/prisma"

async function cleanupDuplicates() {
    console.log("Cleaning up duplicate summaries with zero values...")

    const deleted = await prisma.dailyHourSummary.deleteMany({
        where: {
            totalHours: 0,
            manualHours: 0,
            trackedHours: 0,
        },
    })

    console.log(`Deleted ${deleted.count} zero-value summary records`)

    await prisma.$disconnect()
}

cleanupDuplicates()
