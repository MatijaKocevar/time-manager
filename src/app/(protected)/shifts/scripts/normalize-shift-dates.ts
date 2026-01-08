import { prisma } from "@/lib/prisma"

async function normalizeShiftDates() {
    const shifts = await prisma.shift.findMany()

    for (const shift of shifts) {
        const normalizedDate = new Date(shift.date)
        normalizedDate.setHours(0, 0, 0, 0)

        if (shift.date.getTime() !== normalizedDate.getTime()) {
            await prisma.shift.update({
                where: { id: shift.id },
                data: { date: normalizedDate },
            })
        }
    }
}

normalizeShiftDates()
    .catch((error) => {
        console.error("Error normalizing shift dates:", error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
