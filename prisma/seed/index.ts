import { PrismaClient } from "../generated/client"
import { SeededRandom, addDays } from "./utils"
import { seedHolidays } from "./holidays"
import { seedUsers } from "./users"
import { seedListsForUser } from "./lists"
import { seedTasksForUser, seedTimeEntriesForUser } from "./tasks"
import { seedHourEntriesForUser, recalculateSummariesForUser } from "./hours"
import { seedRequestsForUser } from "./requests"
import { seedShiftsForUser } from "./shifts"

const prisma = new PrismaClient()
const random = new SeededRandom(42)

async function main() {
    console.log("Starting comprehensive database seeding...")
    console.log("Seeding 3 months of data for 10 users\n")

    const totalUsers = 10
    const adminCount = 2
    const batchSize = 5

    const endDate = new Date()
    const startDate = addDays(endDate, -90)

    // Step 1: Seed holidays
    const holidayDates = await seedHolidays(prisma)

    // Step 2: Seed users (totalUsers - 1 because Demo Admin is always created)
    const allUsers = await seedUsers(prisma, random, totalUsers - 1, adminCount)
    const adminUsers = allUsers.filter((u) => u.role === "ADMIN")

    // Step 3: Seed data for each user in batches
    for (let batchIndex = 0; batchIndex < allUsers.length; batchIndex += batchSize) {
        const batch = allUsers.slice(batchIndex, Math.min(batchIndex + batchSize, allUsers.length))
        const batchNum = Math.floor(batchIndex / batchSize) + 1
        const totalBatches = Math.ceil(allUsers.length / batchSize)

        console.log(
            `\nProcessing batch ${batchNum}/${totalBatches} (users ${batchIndex + 1}-${batchIndex + batch.length})`
        )

        for (const user of batch) {
            try {
                console.log(`\n  Seeding data for ${user.name}...`)

                // Lists
                const lists = await seedListsForUser(prisma, random, user.id)
                console.log(`    Created ${lists.length} lists`)

                // Tasks
                const tasks = await seedTasksForUser(prisma, random, user.id, lists)
                console.log(`    Created ~${tasks.length} tasks`)

                // Time entries
                const timeEntries = await seedTimeEntriesForUser(
                    prisma,
                    random,
                    user.id,
                    tasks,
                    endDate
                )
                console.log(`    Created ${timeEntries} time entries`)

                // Hour entries
                const hourEntries = await seedHourEntriesForUser(
                    prisma,
                    random,
                    user.id,
                    tasks,
                    startDate,
                    endDate,
                    holidayDates
                )
                console.log(`    Created ~${hourEntries} hour entries`)

                // Requests
                const requests = await seedRequestsForUser(
                    prisma,
                    random,
                    user.id,
                    adminUsers,
                    endDate,
                    holidayDates
                )
                console.log(`    Created ${requests} requests`)

                // Shifts
                const shifts = await seedShiftsForUser(
                    prisma,
                    random,
                    user.id,
                    startDate,
                    endDate,
                    holidayDates
                )
                console.log(`    ✓ Created ~${shifts} shifts`)
            } catch (error) {
                console.error(`    ❌ Error seeding user ${user.name}:`, error)
            }
        }

        console.log(`\nCompleted batch ${batchNum}/${totalBatches}`)
    }

    console.log(`    Refreshing materialized view...`)
    const summaries = await recalculateSummariesForUser(prisma, "", startDate, endDate)
    console.log(`    Refreshed daily summaries`)

    const stats = {
        users: await prisma.user.count(),
        lists: await prisma.list.count(),
        tasks: await prisma.task.count(),
        timeEntries: await prisma.taskTimeEntry.count(),
        hourEntries: await prisma.hourEntry.count(),
        requests: await prisma.request.count(),
        shifts: await prisma.shift.count(),
        summaries:
            (await prisma.$queryRaw`SELECT COUNT(*) as count FROM daily_hour_summary`) as any,
        holidays: await prisma.holiday.count(),
    }

    const summaryCount = Number((stats.summaries as any)[0]?.count || 0)

    console.log("\n" + "=".repeat(60))
    console.log("DATABASE SEEDING COMPLETED!")
    console.log("=".repeat(60))
    console.log("\nFinal Statistics:")
    console.log(`   Users:               ${stats.users.toLocaleString()}`)
    console.log(`   Lists:               ${stats.lists.toLocaleString()}`)
    console.log(`   Tasks:               ${stats.tasks.toLocaleString()}`)
    console.log(`   Time Entries:        ${stats.timeEntries.toLocaleString()}`)
    console.log(`   Hour Entries:        ${stats.hourEntries.toLocaleString()}`)
    console.log(`   Requests:            ${stats.requests.toLocaleString()}`)
    console.log(`   Shifts:              ${stats.shifts.toLocaleString()}`)
    console.log(`   Daily Summaries:     ${summaryCount.toLocaleString()}`)
    console.log(`   Holidays:            ${stats.holidays.toLocaleString()}`)
    console.log("\nDefault password for all users: password123")
    console.log("=".repeat(60) + "\n")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error("Error seeding database:", e)
        await prisma.$disconnect()
        process.exit(1)
    })
