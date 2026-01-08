import { prisma } from "@/lib/prisma"

async function migrateToHourBasedRequests() {
    console.log("Starting migration to hour-based requests...")

    try {
        const requests = await prisma.request.findMany({
            where: {
                OR: [{ startTime: null }, { endTime: null }],
            },
        })

        console.log(`Found ${requests.length} requests to update`)

        for (const request of requests) {
            await prisma.request.update({
                where: { id: request.id },
                data: {
                    isFullDay: true,
                    startTime: "00:00",
                    endTime: "23:59",
                },
            })
        }

        console.log(`Updated ${requests.length} requests with default time values`)

        const shiftsToUpdate = await prisma.shift.findMany({
            where: {
                OR: [{ startDateTime: null }, { endDateTime: null }],
            },
        })

        console.log(`Found ${shiftsToUpdate.length} shifts to update`)

        for (const shift of shiftsToUpdate) {
            const startDateTime = new Date(shift.date)
            startDateTime.setHours(0, 0, 0, 0)

            const endDateTime = new Date(shift.date)
            endDateTime.setHours(23, 59, 59, 999)

            await prisma.shift.update({
                where: { id: shift.id },
                data: {
                    startDateTime,
                    endDateTime,
                },
            })
        }

        console.log(`Updated ${shiftsToUpdate.length} shifts with DateTime values`)

        console.log("Migration completed successfully!")
    } catch (error) {
        console.error("Migration failed:", error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

migrateToHourBasedRequests()
