import { config } from "dotenv"
import { PrismaClient } from "../prisma/generated/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { seedHolidays } from "../prisma/seed/holidays"

config({ path: [".env.development.local", ".env.local", ".env"], quiet: true })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log("Syncing holidays with the official work-free snapshot...")

    const holidayDates = await seedHolidays(prisma)

    console.log(`✅ Holiday sync complete (${holidayDates.length} work-free days in database)`)
}

main()
    .catch((error) => {
        console.error("❌ Holiday sync failed:", error)
        process.exitCode = 1
    })
    .finally(async () => {
        await prisma.$disconnect()
        await pool.end()
    })
