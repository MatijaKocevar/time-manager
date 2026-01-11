import { prisma } from "../src/lib/prisma"

async function main() {
    console.log("Adding user status fields...")

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "User" 
        ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "deactivatedAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "anonymizedAt" TIMESTAMP(3);
    `)

    console.log("✓ User status fields added successfully")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
