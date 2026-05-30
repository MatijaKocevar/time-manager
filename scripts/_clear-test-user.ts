import { PrismaClient } from "../prisma/generated/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { refreshDailyHourSummary } from "../src/lib/materialized-views"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
const email = process.argv[2] ?? "testuser@example.com"

async function main() {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) {
        console.log(`User not found: ${email}`)
        process.exit(1)
    }

    const id = user.id
    await prisma.taskTimeEntry.deleteMany({ where: { userId: id } })
    await prisma.hourEntry.deleteMany({ where: { userId: id } })
    await prisma.task.deleteMany({ where: { userId: id } })
    await prisma.request.deleteMany({ where: { userId: id } })
    await prisma.shift.deleteMany({ where: { userId: id } })
    await prisma.list.deleteMany({ where: { userId: id } })
    await refreshDailyHourSummary()

    console.log(`Cleared all data for ${email}`)
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
