import { PrismaClient } from "../prisma/generated/client"

const prisma = new PrismaClient()

async function deleteUserData() {
    const userEmail = process.argv[2]

    if (!userEmail) {
        console.error("Please provide user email as argument")
        console.error("Usage: npx tsx scripts/delete-user-data.ts <email>")
        process.exit(1)
    }

    const user = await prisma.user.findUnique({
        where: { email: userEmail },
    })

    if (!user) {
        console.error(`User not found: ${userEmail}`)
        process.exit(1)
    }

    console.log(`Deleting all data for user: ${user.name} (${user.email})`)

    try {
        await prisma.$transaction(async (tx) => {
            // Delete TaskTimeEntry records
            const deletedTimeEntries = await tx.taskTimeEntry.deleteMany({
                where: { userId: user.id },
            })
            console.log(`Deleted ${deletedTimeEntries.count} time entries`)

            // Delete HourEntry records
            const deletedHourEntries = await tx.hourEntry.deleteMany({
                where: { userId: user.id },
            })
            console.log(`Deleted ${deletedHourEntries.count} hour entries`)

            // Delete Shift records
            const deletedShifts = await tx.shift.deleteMany({
                where: { userId: user.id },
            })
            console.log(`Deleted ${deletedShifts.count} shifts`)

            // Delete Task records
            const deletedTasks = await tx.task.deleteMany({
                where: { userId: user.id },
            })
            console.log(`Deleted ${deletedTasks.count} tasks`)

            // Delete Request records
            const deletedRequests = await tx.request.deleteMany({
                where: { userId: user.id },
            })
            console.log(`Deleted ${deletedRequests.count} requests`)
        })

        console.log("\nRefreshing materialized view...")
        await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY daily_hour_summary`
        console.log("Materialized view refreshed (will automatically remove user summaries)")

        console.log("\n✓ All user data deleted successfully")
    } catch (error) {
        console.error("Error deleting user data:", error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

deleteUserData()
