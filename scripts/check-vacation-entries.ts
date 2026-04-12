import { prisma } from "../src/lib/prisma"

async function checkVacationEntries() {
    // Find all vacation time entries
    const vacationEntries = await prisma.taskTimeEntry.findMany({
        where: {
            type: "VACATION",
        },
        include: {
            task: {
                include: {
                    list: true,
                },
            },
            user: {
                select: {
                    email: true,
                },
            },
        },
        orderBy: {
            startTime: "desc",
        },
        take: 10,
    })

    console.log(`\nFound ${vacationEntries.length} vacation time entries:\n`)

    for (const entry of vacationEntries) {
        console.log(`Entry ID: ${entry.id}`)
        console.log(`  User: ${entry.user.email}`)
        console.log(`  Task: ${entry.task.title} (isSystemTask: ${entry.task.isSystemTask})`)
        console.log(`  List: ${entry.task.list?.name || "NULL"}`)
        console.log(`  Type: ${entry.type}`)
        console.log(`  Start: ${entry.startTime}`)
        console.log(`  Duration: ${entry.duration}s`)
        console.log(`  ---`)
    }

    await prisma.$disconnect()
}

checkVacationEntries()
