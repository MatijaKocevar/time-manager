import { PrismaClient } from "../prisma/generated/client"

const prisma = new PrismaClient()

async function refreshView() {
    console.log("Refreshing materialized view...")

    try {
        await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW CONCURRENTLY daily_hour_summary")
        console.log("✓ Materialized view refreshed successfully")
    } catch (error) {
        console.error("Failed to refresh view:", error)
    } finally {
        await prisma.$disconnect()
    }
}

refreshView()
