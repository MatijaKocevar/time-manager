import { PrismaClient } from "../prisma/generated/client"

const prisma = new PrismaClient()

async function checkTrackedHours() {
    console.log("\n=== Checking Tracked Time Entries ===\n")

    // Get recent task time entries
    const timeEntries = await prisma.taskTimeEntry.findMany({
        where: {
            startTime: {
                gte: new Date("2024-12-27"),
            },
            endTime: {
                not: null,
            },
        },
        include: {
            task: {
                select: {
                    title: true,
                },
            },
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            startTime: "desc",
        },
    })

    console.log(`Found ${timeEntries.length} tracked time entries:\n`)

    for (const entry of timeEntries) {
        const startDate = new Date(entry.startTime)
        const dateStr = startDate.toISOString().split("T")[0]
        const duration = entry.duration ? (entry.duration / 3600).toFixed(2) : "N/A"

        console.log(`Entry ID: ${entry.id}`)
        console.log(`  User: ${entry.user.name}`)
        console.log(`  Task: ${entry.task.title}`)
        console.log(`  Date (UTC): ${dateStr}`)
        console.log(`  Date (Local): ${startDate.toLocaleDateString()}`)
        console.log(`  Start: ${entry.startTime.toISOString()}`)
        console.log(`  End: ${entry.endTime?.toISOString()}`)
        console.log(`  Duration: ${duration} hours`)
        console.log()
    }

    console.log("\n=== Checking Approved Requests ===\n")

    // Get approved requests
    const requests = await prisma.request.findMany({
        where: {
            status: "APPROVED",
            startDate: {
                lte: new Date("2024-12-31"),
            },
            endDate: {
                gte: new Date("2024-12-27"),
            },
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            approvedAt: "desc",
        },
    })

    console.log(`Found ${requests.length} approved requests:\n`)

    for (const req of requests) {
        console.log(`Request ID: ${req.id}`)
        console.log(`  User: ${req.user.name}`)
        console.log(`  Type: ${req.type}`)
        console.log(
            `  Date Range: ${req.startDate.toISOString().split("T")[0]} to ${req.endDate.toISOString().split("T")[0]}`
        )
        console.log(`  Affects Hour Type: ${req.affectsHourType}`)
        console.log(`  Approved At: ${req.approvedAt?.toISOString()}`)
        console.log()
    }

    console.log("\n=== Checking Daily Hour Summary ===\n")

    const summaries = await prisma.$queryRaw`
        SELECT 
            "userId",
            date,
            type,
            "manualHours",
            "trackedHours",
            "totalHours"
        FROM daily_hour_summary
        WHERE date >= '2024-12-27'
        ORDER BY date DESC, type
    `

    const summaryArray = summaries as Array<{
        userId: string
        date: Date
        type: string
        manualHours: number
        trackedHours: number
        totalHours: number
    }>

    console.log(`Found ${summaryArray.length} summary records:\n`)

    for (const summary of summaryArray) {
        console.log(`Date: ${summary.date.toISOString().split("T")[0]}`)
        console.log(`  Type: ${summary.type}`)
        console.log(`  Manual Hours: ${summary.manualHours}`)
        console.log(`  Tracked Hours: ${summary.trackedHours}`)
        console.log(`  Total Hours: ${summary.totalHours}`)
        console.log()
    }

    await prisma.$disconnect()
}

checkTrackedHours().catch(console.error)
