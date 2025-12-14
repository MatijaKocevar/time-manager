import { prisma } from "@/lib/prisma"

async function checkDecemberHours() {
    console.log("Checking December hour entries...")

    const decemberStart = new Date("2025-12-01")
    const decemberEnd = new Date("2025-12-31")

    const hourEntries = await prisma.hourEntry.findMany({
        where: {
            date: {
                gte: decemberStart,
                lte: decemberEnd,
            },
        },
        include: {
            user: {
                select: { name: true, email: true },
            },
        },
        orderBy: { date: "asc" },
    })

    console.log(`\nFound ${hourEntries.length} hour entries in December\n`)

    if (hourEntries.length > 0) {
        console.log("Sample entries:")
        hourEntries.slice(0, 10).forEach((entry) => {
            console.log(
                `- ${entry.date.toISOString().split("T")[0]}: ${entry.hours}h type=${entry.type} user=${entry.user.name} taskId=${entry.taskId}`
            )
        })
    }

    const summaries = await prisma.dailyHourSummary.findMany({
        where: {
            date: {
                gte: decemberStart,
                lte: decemberEnd,
            },
        },
        orderBy: { date: "asc" },
    })

    console.log(`\nFound ${summaries.length} daily summaries in December\n`)

    if (summaries.length > 0) {
        const byType = summaries.reduce(
            (acc, s) => {
                if (!acc[s.type]) acc[s.type] = { count: 0, totalHours: 0 }
                acc[s.type].count++
                acc[s.type].totalHours += s.totalHours
                return acc
            },
            {} as Record<string, { count: number; totalHours: number }>
        )

        console.log("Summaries by type:")
        Object.entries(byType).forEach(([type, data]) => {
            console.log(`  ${type}: ${data.count} days, ${data.totalHours} total hours`)
        })
    }

    const requests = await prisma.request.findMany({
        where: {
            status: "APPROVED",
            startDate: { lte: decemberEnd },
            endDate: { gte: decemberStart },
        },
        include: {
            user: { select: { name: true } },
        },
    })

    console.log(`\nFound ${requests.length} approved requests overlapping December\n`)

    requests.forEach((req) => {
        console.log(
            `- ${req.user.name}: ${req.type} from ${req.startDate.toISOString().split("T")[0]} to ${req.endDate.toISOString().split("T")[0]} (affectsHourType: ${req.affectsHourType})`
        )
    })
}

checkDecemberHours()
    .then(() => {
        console.log("\nDone!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Error:", error)
        process.exit(1)
    })
