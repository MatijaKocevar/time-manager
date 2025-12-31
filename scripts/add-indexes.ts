import { PrismaClient } from "../prisma/generated/client"

const prisma = new PrismaClient()

async function main() {
    console.log("Creating composite indexes...")

    await prisma.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS "TaskTimeEntry_userId_startTime_idx" ON "TaskTimeEntry"("userId", "startTime")'
    )
    console.log("✓ Created TaskTimeEntry_userId_startTime_idx")

    await prisma.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS "TaskTimeEntry_userId_endTime_idx" ON "TaskTimeEntry"("userId", "endTime")'
    )
    console.log("✓ Created TaskTimeEntry_userId_endTime_idx")

    await prisma.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS "Task_id_title_status_listId_idx" ON "Task"("id", "title", "status", "listId")'
    )
    console.log("✓ Created Task_id_title_status_listId_idx")

    console.log("Done!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
