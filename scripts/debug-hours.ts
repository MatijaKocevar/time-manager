import { prisma } from "@/lib/prisma"

async function debugHours() {
    const userId = "cmjtl7f7f0000kz80yjbza00c"

    console.log("=== 1. CHECKING DAILY HOUR SUMMARY ===")
    const summaries = await prisma.dailyHourSummary.findMany({
        where: {
            userId,
            date: {
                gte: new Date("2025-12-29T00:00:00Z"),
                lte: new Date("2025-12-31T23:59:59Z"),
            },
        },
        orderBy: [{ date: "asc" }, { type: "asc" }],
    })

    console.log(`Found ${summaries.length} summary rows:`)
    summaries.forEach((s: { date: Date; type: string; manualHours: number; trackedHours: number; totalHours: number }) => {
        console.log(
            `  ${s.date.toISOString().split("T")[0]} | ${s.type.padEnd(16)} | Manual: ${s.manualHours}h | Tracked: ${s.trackedHours}h | Total: ${s.totalHours}h`
        )
    })

    console.log("\n=== 2. CHECKING APPROVED REQUESTS ===")
    const requests = await prisma.request.findMany({
        where: {
            userId,
            startDate: { lte: new Date("2025-12-31T23:59:59Z") },
            endDate: { gte: new Date("2025-12-29T00:00:00Z") },
            status: "APPROVED",
            cancelledAt: null,
        },
    })

    console.log(`Found ${requests.length} approved requests:`)
    requests.forEach((r: { type: string; startDate: Date; endDate: Date; affectsHourType: boolean }) => {
        console.log(
            `  ${r.type} | ${r.startDate.toISOString().split("T")[0]} - ${r.endDate.toISOString().split("T")[0]} | Affects Hour Type: ${r.affectsHourType}`
        )
    })

    console.log("\n=== 3. CHECKING TASK TIME ENTRIES ===")
    const taskEntries = await prisma.taskTimeEntry.findMany({
        where: {
            userId,
            startTime: {
                gte: new Date("2025-12-29T00:00:00Z"),
                lte: new Date("2025-12-31T23:59:59Z"),
            },
        },
        include: {
            task: {
                select: { title: true },
            },
        },
        orderBy: { startTime: "asc" },
    })

    console.log(`Found ${taskEntries.length} task time entries:`)
    taskEntries.forEach((e: { startTime: Date; task: { title: string }; duration: number | null }) => {
        const durationHours = e.duration ? (e.duration / 3600).toFixed(2) : "N/A"
        console.log(
            `  ${e.startTime.toISOString()} | Task: ${e.task.title} | Duration: ${durationHours}h`
        )
    })

    console.log("\n=== 4. CHECKING HOUR ENTRIES ===")
    const hourEntries = await prisma.hourEntry.findMany({
        where: {
            userId,
            date: {
                gte: new Date("2025-12-29T00:00:00Z"),
                lte: new Date("2025-12-31T23:59:59Z"),
            },
        },
        orderBy: [{ date: "asc" }, { type: "asc" }],
    })

    console.log(`Found ${hourEntries.length} hour entries:`)
    hourEntries.forEach((e: { date: Date; type: string; hours: number; taskId: string | null }) => {
        console.log(
            `  ${e.date.toISOString().split("T")[0]} | ${e.type.padEnd(16)} | Hours: ${e.hours}h | TaskId: ${e.taskId || "manual"}`
        )
    })

    console.log("\n=== 5. CHECKING DAY OF WEEK ===")
    const dates = ["2025-12-29", "2025-12-30", "2025-12-31"]
    dates.forEach((dateStr) => {
        const date = new Date(dateStr)
        const dow = date.getDay()
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow]
        const isWeekend = dow === 0 || dow === 6
        console.log(`  ${dateStr} = ${dayName} (DOW: ${dow}) ${isWeekend ? "WEEKEND" : ""}`)
    })

    await prisma.$disconnect()
}

debugHours().catch((error) => {
    console.error("Error:", error)
    process.exit(1)
})
