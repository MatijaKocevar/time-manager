import { PrismaClient } from "../generated/client"
import { SeededRandom, addDays } from "./utils"
import { seedHolidays } from "./holidays"
import { seedUsers } from "./users"
import { seedListsForUser } from "./lists"
import { seedTasksForUser, seedTimeEntriesForUser } from "./tasks"
import { seedHourEntriesForUser, recalculateSummariesForUser } from "./hours"
import { seedRequestsForUser } from "./requests"
import * as readline from "readline/promises"

const prisma = new PrismaClient()
const random = new SeededRandom(42)

async function getSeederOptions(): Promise<{
    months: number
    userCount: number
    minimal: boolean
}> {
    const args = process.argv.slice(2)
    const monthsArg = args.find((arg) => arg.startsWith("--months="))
    const usersArg = args.find((arg) => arg.startsWith("--users="))
    const minimalArg = args.includes("--minimal")

    if (minimalArg) {
        return { months: 0, userCount: 0, minimal: true }
    }

    if (monthsArg && usersArg) {
        const months = parseInt(monthsArg.split("=")[1])
        const userCount = parseInt(usersArg.split("=")[1])

        if ([1, 3, 6, 12].includes(months) && userCount >= 1 && userCount <= 100) {
            return { months, userCount, minimal: false }
        }
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    console.log("\n=== Database Seeder Configuration ===\n")

    const modeInput = await rl.question(
        "Select seeding mode:\n  1) Minimal (Demo Admin only, no test data)\n  2) Full (Generate test data)\nEnter choice (1-2): "
    )

    if (parseInt(modeInput) === 1) {
        rl.close()
        return { months: 0, userCount: 0, minimal: true }
    }

    let months: number
    while (true) {
        const monthsInput = await rl.question(
            "\nHow much data to generate?\n  1) 1 month\n  2) 3 months\n  3) 6 months\n  4) 1 year\nEnter choice (1-4): "
        )
        const choice = parseInt(monthsInput)

        if (choice === 1) {
            months = 1
            break
        } else if (choice === 2) {
            months = 3
            break
        } else if (choice === 3) {
            months = 6
            break
        } else if (choice === 4) {
            months = 12
            break
        }
        console.log("Invalid choice. Please enter 1, 2, 3, or 4.\n")
    }

    let userCount: number
    while (true) {
        const usersInput = await rl.question("\nHow many users to create? (1-100): ")
        const count = parseInt(usersInput)

        if (count >= 1 && count <= 100) {
            userCount = count
            break
        }
        console.log("Invalid number. Please enter a number between 1 and 100.\n")
    }

    rl.close()
    return { months, userCount, minimal: false }
}

async function main() {
    const { months, userCount, minimal } = await getSeederOptions()

    if (minimal) {
        console.log("\n" + "=".repeat(60))
        console.log("MINIMAL SEEDING MODE")
        console.log("=".repeat(60))
        console.log(`  Creating Demo Admin account only`)
        console.log(`  Email:               demo@example.com`)
        console.log(`  Password:            password123`)
        console.log(`  Role:                ADMIN`)
        console.log("=".repeat(60) + "\n")

        await seedUsers(prisma, random, 0, 0, true)

        console.log("\n" + "=".repeat(60))
        console.log("MINIMAL SEEDING COMPLETED!")
        console.log("=".repeat(60))
        console.log("\nCreated Accounts:")
        console.log(`   Users:               1`)
        console.log(`   Demo Admin:          demo@example.com`)
        console.log(`   Password:            password123`)
        console.log("=".repeat(60) + "\n")
        return
    }

    const adminCount = Math.max(1, Math.floor(userCount * 0.2))
    const batchSize = 5

    const endDate = new Date()
    const startDate = addDays(endDate, -months * 30)

    console.log("\n" + "=".repeat(60))
    console.log("FULL SEEDING CONFIGURATION")
    console.log("=".repeat(60))
    console.log(`  Data period:         ${months} month${months > 1 ? "s" : ""}`)
    console.log(
        `  Total users:         ${userCount} (${adminCount} admin${adminCount > 1 ? "s" : ""}, ${userCount - adminCount} regular)`
    )
    console.log(
        `  Date range:          ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`
    )
    console.log(`  Demo account:        demo@example.com (always created)`)
    console.log("=".repeat(60) + "\n")

    console.log("Starting comprehensive database seeding...")

    // Step 1: Seed holidays
    const holidayDates = await seedHolidays(prisma)

    // Step 2: Seed users (userCount - 1 because Demo Admin is always created)
    const allUsers = await seedUsers(prisma, random, userCount - 1, adminCount, false)
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
                    startDate,
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
                    startDate,
                    endDate,
                    holidayDates
                )
                console.log(`    Created ${requests} requests`)
            } catch (error) {
                console.error(`    ❌ Error seeding user ${user.name}:`, error)
            }
        }

        console.log(`\nCompleted batch ${batchNum}/${totalBatches}`)
    }

    console.log(`    Refreshing materialized view...`)
    await recalculateSummariesForUser(prisma, "", startDate, endDate)
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
            (await prisma.$queryRaw`SELECT COUNT(*) as count FROM daily_hour_summary`) as Array<{
                count: bigint
            }>,
        holidays: await prisma.holiday.count(),
    }

    const summaryCount = Number(stats.summaries[0]?.count || 0)

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
