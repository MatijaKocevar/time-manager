import { PrismaClient } from "../prisma/generated/client"
import bcrypt from "bcryptjs"
import { SeededRandom } from "../prisma/seed/utils"
import { seedHolidays } from "../prisma/seed/holidays"
import { seedListsForUser } from "../prisma/seed/lists"
import { seedTasksForUser, seedTimeEntriesForUser } from "../prisma/seed/tasks"
import { seedHourEntriesForUser, recalculateSummariesForUser } from "../prisma/seed/hours"
import { seedRequestsForUser } from "../prisma/seed/requests"
import { seedShiftsForUser } from "../prisma/seed/shifts"

const prisma = new PrismaClient()
const random = new SeededRandom(99)

function getArgs(): { email: string; name: string; year: number } {
    const args = process.argv.slice(2)
    const emailArg = args.find((a) => a.startsWith("--email="))
    const nameArg = args.find((a) => a.startsWith("--name="))
    const yearArg = args.find((a) => a.startsWith("--year="))

    const email = emailArg ? emailArg.split("=")[1] : "testuser@example.com"
    const name = nameArg ? nameArg.split("=")[1] : "Test User"
    const year = yearArg ? parseInt(yearArg.split("=")[1]) : new Date().getFullYear()

    if (isNaN(year) || year < 2000 || year > 2100) {
        console.error("--year must be a valid 4-digit year")
        process.exit(1)
    }

    return { email, name, year }
}

async function main() {
    const { email, name, year } = getArgs()

    const startDate = new Date(Date.UTC(year, 0, 1))
    const endDate = new Date(Date.UTC(year, 11, 31))

    console.log("\n" + "=".repeat(60))
    console.log("SEED TEST USER")
    console.log("=".repeat(60))
    console.log(`  Email:      ${email}`)
    console.log(`  Name:       ${name}`)
    console.log(`  Year:       ${year}`)
    console.log(
        `  Date range: ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`
    )
    console.log("=".repeat(60) + "\n")

    const hashedPassword = await bcrypt.hash("password123", 12)

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name,
            password: hashedPassword,
            role: "USER",
            emailVerified: new Date(),
        },
    })

    console.log(`User: ${user.name} (${user.id})\n`)

    console.log("Fetching holidays...")
    const holidays = await seedHolidays(prisma)

    const adminUsers = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true, role: true },
    })

    console.log("\nSeeding lists...")
    const lists = await seedListsForUser(prisma, random, user.id)
    console.log(`  Created ${lists.length} lists`)

    console.log("Seeding tasks...")
    const tasks = await seedTasksForUser(prisma, random, user.id, lists)
    console.log(`  Created ~${tasks.length} tasks`)

    console.log("Seeding time entries...")
    const timeEntries = await seedTimeEntriesForUser(
        prisma,
        random,
        user.id,
        tasks,
        startDate,
        endDate
    )
    console.log(`  Created ${timeEntries} time entries`)

    console.log("Seeding hour entries...")
    const hourEntries = await seedHourEntriesForUser(
        prisma,
        random,
        user.id,
        tasks,
        startDate,
        endDate,
        holidays
    )
    console.log(`  Created ~${hourEntries} hour entries`)

    console.log("Seeding requests...")
    const requests = await seedRequestsForUser(
        prisma,
        random,
        user.id,
        adminUsers,
        startDate,
        endDate,
        holidays
    )
    console.log(`  Created ${requests} requests`)

    console.log("Seeding shifts...")
    const shifts = await seedShiftsForUser(prisma, random, user.id, startDate, endDate, holidays)
    console.log(`  Created ${shifts} shifts`)

    console.log("\nRefreshing materialized views...")
    await recalculateSummariesForUser()

    console.log("\n" + "=".repeat(60))
    console.log("DONE")
    console.log("=".repeat(60))
    console.log(`  Email:    ${email}`)
    console.log(`  Password: password123`)
    console.log("=".repeat(60) + "\n")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error("Error:", e)
        await prisma.$disconnect()
        process.exit(1)
    })
