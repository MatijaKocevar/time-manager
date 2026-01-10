import { PrismaClient } from "../prisma/generated/client"

const prisma = new PrismaClient()

async function clearTimeData() {
    console.log("🗑️  Clearing all data except users...")

    try {
        await prisma.$transaction(async (tx) => {
            console.log("Deleting TaskTimeEntry records...")
            await tx.taskTimeEntry.deleteMany({})

            console.log("Deleting HourEntry records...")
            await tx.hourEntry.deleteMany({})

            console.log("Deleting Task records...")
            await tx.task.deleteMany({})

            console.log("Deleting Request records...")
            await tx.request.deleteMany({})

            console.log("Deleting Shift records...")
            await tx.shift.deleteMany({})

            console.log("Deleting List records...")
            await tx.list.deleteMany({})

            console.log("Deleting Holiday records...")
            await tx.holiday.deleteMany({})

            console.log("Deleting Notification records...")
            await tx.notification.deleteMany({})

            console.log("Deleting VerificationToken records...")
            await tx.verificationToken.deleteMany({})

            console.log("Refreshing DailyHourSummary materialized view...")
            await tx.$executeRawUnsafe("REFRESH MATERIALIZED VIEW CONCURRENTLY daily_hour_summary")
        })

        console.log("✅ All data cleared successfully!")
        console.log("👤 User accounts and authentication data preserved")
    } catch (error) {
        console.error("❌ Error clearing data:", error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

clearTimeData()
