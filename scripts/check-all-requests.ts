import { PrismaClient } from "../prisma/generated/client"

const prisma = new PrismaClient()

async function checkRequests() {
    console.log("\n=== Checking ALL requests for Dec 28-31 ===\n")

    const requests = await prisma.request.findMany({
        where: {
            startDate: {
                lte: new Date("2024-12-31T23:59:59Z"),
            },
            endDate: {
                gte: new Date("2024-12-28T00:00:00Z"),
            },
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    console.log(`Found ${requests.length} requests:\n`)

    for (const req of requests) {
        console.log(`Request ID: ${req.id}`)
        console.log(`  User: ${req.user.name}`)
        console.log(`  Type: ${req.type}`)
        console.log(`  Status: ${req.status}`)
        console.log(`  Start: ${req.startDate.toISOString()}`)
        console.log(`  End: ${req.endDate.toISOString()}`)
        console.log(`  Affects Hour Type: ${req.affectsHourType}`)
        console.log(`  Approved At: ${req.approvedAt?.toISOString() || "Not approved"}`)
        console.log(`  Cancelled At: ${req.cancelledAt?.toISOString() || "Not cancelled"}`)
        console.log()
    }

    await prisma.$disconnect()
}

checkRequests().catch(console.error)
