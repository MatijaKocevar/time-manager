import { prisma } from "../src/lib/prisma"

async function addIndexes() {
    try {
        console.log("Creating composite indexes...")

        await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_userId_status_listId_idx" 
      ON "Task"("userId", "status", "listId")
    `)
        console.log("✓ Created index: Task_userId_status_listId_idx")

        await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_userId_listId_status_idx" 
      ON "Task"("userId", "listId", "status")
    `)
        console.log("✓ Created index: Task_userId_listId_status_idx")

        console.log("All indexes created successfully!")
    } catch (error) {
        if (error instanceof Error && error.message.includes("already exists")) {
            console.log("Indexes already exist")
        } else {
            console.error("Error creating indexes:", error)
            throw error
        }
    } finally {
        await prisma.$disconnect()
    }
}

addIndexes()
