import { prisma } from "@/lib/prisma"

async function listUsers() {
    console.log("=== CHECKING ALL USERS ===")
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
        },
    })

    console.log(`Found ${users.length} users:`)
    users.forEach((u: { id: string; name: string | null; email: string }) => {
        console.log(`  ID: ${u.id} | Name: ${u.name || "N/A"} | Email: ${u.email}`)
    })

    await prisma.$disconnect()
}

listUsers().catch((error: Error) => {
    console.error("Error:", error)
    process.exit(1)
})
