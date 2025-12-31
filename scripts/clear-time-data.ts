import { prisma } from "@/lib/prisma"

async function clearTimeData() {
    console.log("Clearing all time-tracking data while preserving users...")

    try {
        await prisma.$transaction(async (tx) => {
            console.log("Deleting TaskTimeEntry records...")
            const taskTimeEntries = await tx.taskTimeEntry.deleteMany({})
            console.log(`  Deleted ${taskTimeEntries.count} task time entries`)

            console.log("Deleting HourEntry records...")
            const hourEntries = await tx.hourEntry.deleteMany({})
            console.log(`  Deleted ${hourEntries.count} hour entries`)

            console.log("Refreshing DailyHourSummary materialized view...")
            await tx.$executeRaw`REFRESH MATERIALIZED VIEW daily_hour_summary`
            console.log(`  Refreshed materialized view`)

            console.log("Deleting Task records...")
            const tasks = await tx.task.deleteMany({})
            console.log(`  Deleted ${tasks.count} tasks`)

            console.log("Deleting Request records...")
            const requests = await tx.request.deleteMany({})
            console.log(`  Deleted ${requests.count} requests`)

            console.log("Deleting Shift records...")
            const shifts = await tx.shift.deleteMany({})
            console.log(`  Deleted ${shifts.count} shifts`)

            console.log("Deleting List records...")
            const lists = await tx.list.deleteMany({})
            console.log(`  Deleted ${lists.count} lists`)
        })

        console.log("\n✅ Successfully cleared all time-tracking data!")
        console.log("Users, holidays, and authentication data preserved.")

        await prisma.$disconnect()
    } catch (error) {
        console.error("❌ Error clearing data:", error)
        await prisma.$disconnect()
        process.exit(1)
    }
}

clearTimeData()
