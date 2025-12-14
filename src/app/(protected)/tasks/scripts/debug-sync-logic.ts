import { prisma } from "@/lib/prisma"

async function debugSyncLogic() {
    console.log("Debug: What the sync script does for TaskTimeEntry\n")

    const entries = await prisma.taskTimeEntry.findMany({
        where: { duration: { not: null } },
        select: { id: true, userId: true, startTime: true },
        orderBy: { startTime: "desc" },
    })

    console.log(`Found ${entries.length} TaskTimeEntry records\n`)

    for (const entry of entries) {
        console.log(`\nEntry ${entry.id}:`)
        console.log(`  Raw startTime: ${entry.startTime.toISOString()}`)

        const date = new Date(entry.startTime)
        console.log(`  Before setHours: ${date.toISOString()}`)

        date.setHours(0, 0, 0, 0)
        console.log(`  After setHours(0,0,0,0): ${date.toISOString()}`)
        console.log(`  Local date string: ${date.toLocaleDateString()}`)

        const key = `${date.toISOString()}-WORK`
        console.log(`  Sync would use key: ${key}`)

        const approvedRemoteRequest = await prisma.request.findFirst({
            where: {
                userId: entry.userId,
                status: "APPROVED",
                affectsHourType: true,
                startDate: { lte: date },
                endDate: { gte: date },
            },
        })

        const hourType = approvedRemoteRequest ? "WORK_FROM_HOME" : "WORK"
        console.log(`  Determined hourType: ${hourType}`)
        console.log(
            `  Would call recalculateDailySummaryStandalone(userId, ${date.toISOString()}, "${hourType}")`
        )
    }
}

debugSyncLogic()
    .catch((error) => {
        console.error("Debug failed:", error)
        process.exit(1)
    })
    .finally(() => {
        prisma.$disconnect()
    })
