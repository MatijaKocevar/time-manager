import { prisma } from "@/lib/prisma"

async function debugTimezoneIssue() {
    console.log("Timezone Debug\n")

    const now = new Date()
    console.log("Current time (raw):", now)
    console.log("Current time ISO:", now.toISOString())
    console.log("Timezone offset (minutes):", now.getTimezoneOffset())

    const normalizedLocal = new Date()
    normalizedLocal.setHours(0, 0, 0, 0)
    console.log("\nNormalized to midnight (local time):", normalizedLocal)
    console.log("As ISO string (UTC):", normalizedLocal.toISOString())

    const requests = await prisma.request.findMany({
        where: {
            status: "APPROVED",
            affectsHourType: true,
        },
    })

    if (requests.length === 0) {
        console.log("\nNo approved requests found!")
        return
    }

    const request = requests[0]
    console.log("\nRequest dates:")
    console.log("startDate:", request.startDate, "->", request.startDate.toISOString())
    console.log("endDate:", request.endDate, "->", request.endDate.toISOString())

    console.log("\nComparison check:")
    console.log("request.startDate <= normalizedLocal:", request.startDate <= normalizedLocal)
    console.log("request.endDate >= normalizedLocal:", request.endDate >= normalizedLocal)
    console.log(
        "Should match:",
        request.startDate <= normalizedLocal && request.endDate >= normalizedLocal
    )

    const normalizedLocalDate = new Date(now)
    normalizedLocalDate.setHours(0, 0, 0, 0)

    console.log("\n--- Running the actual query from task-time-actions.ts ---")
    const approvedRemoteRequest = await prisma.request.findFirst({
        where: {
            userId: request.userId,
            status: "APPROVED",
            affectsHourType: true,
            startDate: { lte: normalizedLocalDate },
            endDate: { gte: normalizedLocalDate },
        },
    })

    console.log("Result:", approvedRemoteRequest ? "FOUND (WORK_FROM_HOME)" : "NOT FOUND (WORK)")
    if (approvedRemoteRequest) {
        console.log("Matched request:", {
            id: approvedRemoteRequest.id,
            type: approvedRemoteRequest.type,
            startDate: approvedRemoteRequest.startDate.toISOString(),
            endDate: approvedRemoteRequest.endDate.toISOString(),
        })
    }
}

debugTimezoneIssue()
    .catch((error) => {
        console.error("Debug failed:", error)
        process.exit(1)
    })
    .finally(() => {
        prisma.$disconnect()
    })
