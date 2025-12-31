import { prisma } from "../src/lib/prisma"

async function main() {
    console.log("=== Before Approval ===\n")

    // Show all TaskTimeEntry records
    const taskTimeEntries = await prisma.taskTimeEntry.findMany({
        include: {
            task: {
                select: {
                    title: true,
                },
            },
        },
        orderBy: [{ startTime: "asc" }],
    })

    console.log("TaskTimeEntry records:")
    for (const entry of taskTimeEntries) {
        console.log(
            `  - Task: ${entry.task.title}, Type: ${entry.type}, Start: ${entry.startTime.toISOString()}, Duration: ${entry.duration}s`
        )
    }

    // Show all HourEntry records
    const hourEntries = await prisma.hourEntry.findMany({
        orderBy: [{ date: "asc" }],
    })

    console.log("\nHourEntry records:")
    for (const entry of hourEntries) {
        console.log(
            `  - Date: ${entry.date.toISOString()}, Type: ${entry.type}, Hours: ${entry.hours}`
        )
    }

    // Show all pending requests
    const requests = await prisma.request.findMany({
        where: {
            status: "PENDING",
        },
    })

    console.log("\nPending requests:")
    for (const req of requests) {
        console.log(
            `  - ID: ${req.id}, Type: ${req.type}, ${req.startDate.toISOString()} to ${req.endDate.toISOString()}`
        )
    }

    // Show materialized view
    const summaries = await prisma.$queryRaw<
        Array<{
            date: Date
            type: string
            manual_hours: number
            tracked_hours: number
            total_hours: number
        }>
    >`SELECT * FROM daily_hour_summary ORDER BY date, type`

    console.log("\nDaily Hour Summary:")
    for (const summary of summaries) {
        console.log(
            `  - Date: ${summary.date.toISOString().split("T")[0]}, Type: ${summary.type}, Manual: ${summary.manual_hours}h, Tracked: ${summary.tracked_hours}h, Total: ${summary.total_hours}h`
        )
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
