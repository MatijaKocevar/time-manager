import { PrismaClient } from "../../../../prisma/generated/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function cleanup() {
    try {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        await prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: ninetyDaysAgo,
                },
            },
        })

        await prisma.$disconnect()
        process.exit(0)
    } catch (error) {
        console.error("Cleanup failed:", error)
        await prisma.$disconnect()
        process.exit(1)
    }
}

cleanup()
