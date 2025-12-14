import { prisma } from "@/lib/prisma"

async function debugRequests() {
    console.log("Checking approved WORK_FROM_HOME requests...")

    const requests = await prisma.request.findMany({
        where: {
            status: "APPROVED",
            affectsHourType: true,
        },
        select: {
            id: true,
            userId: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
            affectsHourType: true,
        },
    })

    console.log(`Found ${requests.length} approved requests:`)
    requests.forEach((req) => {
        console.log({
            id: req.id,
            userId: req.userId,
            type: req.type,
            startDate: req.startDate,
            endDate: req.endDate,
            affectsHourType: req.affectsHourType,
        })
    })

    const testDate = new Date()
    testDate.setHours(0, 0, 0, 0)
    console.log("\nTest date (normalized to midnight):", testDate)

    console.log("\nChecking if test date falls within any request range:")
    requests.forEach((req) => {
        const matches = req.startDate <= testDate && req.endDate >= testDate
        console.log(
            `${req.type} (${req.startDate.toISOString()} to ${req.endDate.toISOString()}): ${matches ? "MATCHES" : "NO MATCH"}`
        )
    })

    const taskTimeEntries = await prisma.taskTimeEntry.findMany({
        where: {
            duration: { not: null },
        },
        select: {
            id: true,
            userId: true,
            startTime: true,
            endTime: true,
            duration: true,
        },
        orderBy: {
            startTime: "desc",
        },
        take: 5,
    })

    console.log("\nRecent TaskTimeEntry records:")
    taskTimeEntries.forEach((entry) => {
        const entryDate = new Date(entry.startTime)
        entryDate.setHours(0, 0, 0, 0)
        console.log({
            id: entry.id,
            startTime: entry.startTime,
            normalizedDate: entryDate,
            duration: entry.duration,
        })

        const matchingRequest = requests.find(
            (req) =>
                req.userId === entry.userId &&
                req.startDate <= entryDate &&
                req.endDate >= entryDate
        )
        console.log(
            `  -> Would be logged as: ${matchingRequest ? "WORK_FROM_HOME" : "WORK"} ${matchingRequest ? `(matched request ${matchingRequest.id})` : ""}`
        )
    })
}

debugRequests()
    .catch((error) => {
        console.error("Debug failed:", error)
        process.exit(1)
    })
    .finally(() => {
        prisma.$disconnect()
    })
