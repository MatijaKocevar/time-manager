import { prisma } from "@/lib/prisma"

async function migrateToHourBasedRequests() {
    try {
        const requests = await prisma.request.findMany({
            where: {
                OR: [{ startTime: null }, { endTime: null }],
            },
        })

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

        const shiftsToUpdate = await prisma.shift.findMany({
            where: {
                OR: [{ startDateTime: null }, { endDateTime: null }],
            },
        })

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
    } catch (error) {
        console.error("Migration failed:", error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

migrateToHourBasedRequests()
