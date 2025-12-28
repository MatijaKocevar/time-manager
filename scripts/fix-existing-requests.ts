import { PrismaClient } from "../prisma/generated/client"

const prisma = new PrismaClient()

async function fixExistingRequests() {
    console.log("Updating existing requests to affect hour types...")

    const result = await prisma.request.updateMany({
        where: {
            affectsHourType: false,
        },
        data: {
            affectsHourType: true,
        },
    })

    console.log(`✓ Updated ${result.count} requests to affectsHourType=true`)

    await prisma.$disconnect()
}

fixExistingRequests().catch(console.error)
