import { PrismaClient } from "./prisma/generated/client/index.js"
const prisma = new PrismaClient()

async function check() {
    const entries = await prisma.hourEntry.findMany({
        where: { date: { gte: new Date("2025-12-01"), lte: new Date("2025-12-31") } },
        orderBy: { date: "asc" },
    })

    const entryDates = new Set(entries.map((e) => e.date.toISOString().split("T")[0]))

    console.log("Working days in December 2025:")
    for (let day = 1; day <= 31; day++) {
        const date = new Date(2025, 11, day)
        const dayOfWeek = date.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const dateStr = date.toISOString().split("T")[0]
        const hasEntry = entryDates.has(dateStr)

        if (!isWeekend) {
            console.log(dateStr, hasEntry ? "✓" : "✗ MISSING")
        }
    }

    console.log("\nTotal entries:", entries.length)
    console.log("Total hours:", entries.reduce((sum, e) => sum + e.hours, 0))

    await prisma.$disconnect()
}

check()
