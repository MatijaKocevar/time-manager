import { prisma } from "@/lib/prisma"

async function debugRequestLookup() {
    const entry = await prisma.taskTimeEntry.findFirst({
        where: { duration: { not: null } },
        orderBy: { startTime: "desc" },
    })

    if (!entry) {
        console.log("No entries found")
        return
    }

    console.log("TaskTimeEntry startTime:", entry.startTime.toISOString())
    console.log("User ID:", entry.userId)

    const entryDate = new Date(entry.startTime)
    const entryDateUTC = new Date(
        Date.UTC(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
    )

    console.log("entryDateUTC:", entryDateUTC.toISOString())

    const request = await prisma.request.findFirst({
        where: {
            userId: entry.userId,
            status: "APPROVED",
            affectsHourType: true,
            startDate: { lte: entryDateUTC },
            endDate: { gte: entryDateUTC },
        },
    })

    console.log("\nFound request:", request ? "YES" : "NO")

    if (request) {
        console.log("Request type:", request.type)
        console.log(
            "Request range:",
            request.startDate.toISOString(),
            "to",
            request.endDate.toISOString()
        )
        console.log("Comparison:")
        console.log("  startDate <= entryDateUTC:", request.startDate <= entryDateUTC)
        console.log("  endDate >= entryDateUTC:", request.endDate >= entryDateUTC)
    } else {
        console.log("\nChecking all approved requests for this user:")
        const allRequests = await prisma.request.findMany({
            where: {
                userId: entry.userId,
                status: "APPROVED",
                affectsHourType: true,
            },
        })
        console.log(`Found ${allRequests.length} approved requests`)
        allRequests.forEach((r) => {
            console.log(`  ${r.type}: ${r.startDate.toISOString()} to ${r.endDate.toISOString()}`)
            console.log(`    Matches? startDate <= entryDateUTC: ${r.startDate <= entryDateUTC}`)
            console.log(`    Matches? endDate >= entryDateUTC: ${r.endDate >= entryDateUTC}`)
        })
    }
}

debugRequestLookup()
    .catch((error) => {
        console.error("Debug failed:", error)
        process.exit(1)
    })
    .finally(() => {
        prisma.$disconnect()
    })
