import { PrismaClient } from "../../../../prisma/generated/client"

const prisma = new PrismaClient()

async function cleanup() {
    try {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        const result = await prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: ninetyDaysAgo,
                },
            },
        })

        console.log(`Cleaned up ${result.count} notifications older than 90 days`)
        await prisma.$disconnect()
        process.exit(0)
    } catch (error) {
        console.error("Cleanup failed:", error)
        await prisma.$disconnect()
        process.exit(1)
    }
}

cleanup()
