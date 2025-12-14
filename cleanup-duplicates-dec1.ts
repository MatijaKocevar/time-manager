import { PrismaClient } from "./prisma/generated/client/index.js"

const prisma = new PrismaClient()

async function cleanupDuplicates() {
    const dec1Start = new Date(2025, 11, 1)
    dec1Start.setHours(0, 0, 0, 0)
    const dec2Start = new Date(2025, 11, 2)
    dec2Start.setHours(0, 0, 0, 0)

    console.log("Finding Dec 1 entries...")
    const entries = await prisma.hourEntry.findMany({
        where: {
            date: {
                gte: dec1Start,
                lt: dec2Start,
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    })

    console.log(`Found ${entries.length} entries for Dec 1`)

    if (entries.length > 1) {
        console.log("\nEntries:")
        entries.forEach((e, i) => {
            console.log(
                `  ${i + 1}. ID: ${e.id}, Hours: ${e.hours}, Type: ${e.type}, Created: ${e.createdAt.toISOString()}`
            )
        })

        console.log("\nDeleting older duplicate entries (keeping the first one)...")
        const toDelete = entries.slice(1)
        for (const entry of toDelete) {
            await prisma.hourEntry.delete({
                where: { id: entry.id },
            })
            console.log(`  Deleted: ${entry.id}`)
        }

        console.log("\nRecalculating summary for Dec 1...")
        const { recalculateDailySummaryStandalone } = await import(
            "./src/app/(protected)/hours/utils/summary-helpers.js"
        )
        await recalculateDailySummaryStandalone(entries[0].userId, dec1Start, entries[0].type)

        console.log("Done!")
    } else {
        console.log("No duplicates found")
    }

    await prisma.$disconnect()
}

cleanupDuplicates().catch(console.error)
