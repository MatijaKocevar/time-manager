import { PrismaClient } from "../prisma/generated/client"

const prisma = new PrismaClient()

async function checkDec28() {
    console.log("\n=== Checking Dec 28, 2024 ===\n")

    // Check requests for Dec 28
    const requests = await prisma.request.findMany({
        where: {
            status: "APPROVED",
            affectsHourType: true,
            startDate: {
                lte: new Date("2024-12-28T23:59:59Z"),
            },
            endDate: {
                gte: new Date("2024-12-28T00:00:00Z"),
            },
            cancelledAt: null,
        },
        include: {
            user: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            approvedAt: "desc",
        },
    })

    console.log(`Found ${requests.length} approved requests affecting hour type for Dec 28:\n`)

    for (const req of requests) {
        console.log(`Request ID: ${req.id}`)
        console.log(`  User: ${req.user.name}`)
        console.log(`  Type: ${req.type}`)
        console.log(`  Start: ${req.startDate.toISOString()}`)
        console.log(`  End: ${req.endDate.toISOString()}`)
        console.log(`  Affects Hour Type: ${req.affectsHourType}`)
        console.log(`  Approved At: ${req.approvedAt?.toISOString()}`)
        console.log()
    }

    // Check summary for Dec 28
    const summaries = await prisma.$queryRaw`
        SELECT 
            "userId",
            date,
            type,
            "manualHours",
            "trackedHours",
            "totalHours"
        FROM daily_hour_summary
        WHERE date = '2024-12-28'
        ORDER BY type
    `

    const summaryArray = summaries as Array<{
        userId: string
        date: Date
        type: string
        manualHours: number
        trackedHours: number
        totalHours: number
    }>

    console.log(`\nSummaries for Dec 28: ${summaryArray.length}\n`)

    for (const summary of summaryArray) {
        console.log(
            `Type: ${summary.type}, Tracked: ${summary.trackedHours}h, Total: ${summary.totalHours}h`
        )
    }

    await prisma.$disconnect()
}

checkDec28().catch(console.error)
