import { prisma } from "@/lib/prisma"

async function debugMigration() {
    const request = await prisma.request.findFirst({
        where: {
            status: "APPROVED",
            affectsHourType: true,
            type: "WORK_FROM_HOME",
        },
        include: {
            user: { select: { name: true, email: true } },
        },
    })

    if (!request) {
        console.log("No request found!")
        return
    }

    console.log("Request details:")
    console.log(`  ID: ${request.id}`)
    console.log(`  User ID: ${request.userId}`)
    console.log(`  User: ${request.user.name} (${request.user.email})`)
    console.log(`  Type: ${request.type}`)
    console.log(`  Dates: ${request.startDate.toISOString().split("T")[0]} to ${request.endDate.toISOString().split("T")[0]}`)

    const testDate = new Date("2025-12-02")
    testDate.setHours(0, 0, 0, 0)

    console.log(`\nChecking for WORK entries on ${testDate.toISOString().split("T")[0]}:`)

    const workEntries = await prisma.hourEntry.findMany({
        where: {
            userId: request.userId,
            date: testDate,
            type: "WORK",
            taskId: null,
        },
    })

    console.log(`Found ${workEntries.length} entries`)
    workEntries.forEach((e) => {
        console.log(`  - ID: ${e.id}, Hours: ${e.hours}, Type: ${e.type}`)
    })

    const allDecemberEntries = await prisma.hourEntry.findMany({
        where: {
            userId: request.userId,
            date: {
                gte: new Date("2025-12-01"),
                lte: new Date("2025-12-31"),
            },
        },
        orderBy: { date: "asc" },
    })

    console.log(`\nTotal December entries for this user: ${allDecemberEntries.length}`)
    console.log("Types:", [...new Set(allDecemberEntries.map((e) => e.type))])
}

debugMigration()
    .then(() => {
        console.log("\nDone!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Error:", error)
        process.exit(1)
    })
