import { prisma } from "@/lib/prisma"

async function normalizeShiftDates() {
    console.log("Starting shift date normalization...")

    const shifts = await prisma.shift.findMany()
    console.log(`Found ${shifts.length} shifts to check`)

    let updatedCount = 0

    for (const shift of shifts) {
        const normalizedDate = new Date(shift.date)
        normalizedDate.setHours(0, 0, 0, 0)

        if (shift.date.getTime() !== normalizedDate.getTime()) {
            console.log(
                `Normalizing shift ${shift.id}: ${shift.date.toISOString()} -> ${normalizedDate.toISOString()}`
            )

            await prisma.shift.update({
                where: { id: shift.id },
                data: { date: normalizedDate },
            })

            updatedCount++
        }
    }

    console.log(`Normalization complete. Updated ${updatedCount} shifts.`)
}

normalizeShiftDates()
    .catch((error) => {
        console.error("Error normalizing shift dates:", error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
