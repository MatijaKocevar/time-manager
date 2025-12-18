import { PrismaClient, ShiftLocation } from "../generated/client"
import { SeededRandom, normalizeDate, dateRange, isWeekday } from "./utils"

export async function seedShiftsForUser(
    prisma: PrismaClient,
    random: SeededRandom,
    userId: string,
    startDate: Date,
    endDate: Date,
    holidays: Date[]
) {
    const shifts = []
    const locations: ShiftLocation[] = ["OFFICE", "HOME", "VACATION", "SICK_LEAVE", "OTHER"]
    const locationWeights = [70, 20, 5, 3, 2]

    for (const date of dateRange(startDate, endDate)) {
        if (!isWeekday(date)) continue
        if (holidays.some((h) => h.getTime() === date.getTime())) continue

        if (random.next() > 0.6) continue

        const rand = random.nextInt(0, 99)
        let location: ShiftLocation = "OFFICE"
        let cumulative = 0
        for (let j = 0; j < locationWeights.length; j++) {
            cumulative += locationWeights[j]
            if (rand < cumulative) {
                location = locations[j]
                break
            }
        }

        shifts.push({
            userId,
            date: normalizeDate(date),
            location,
            notes: null,
        })
    }

    for (const shift of shifts) {
        try {
            await prisma.shift.create({ data: shift })
        } catch {
            // Skip duplicates
        }
    }

    return shifts.length
}
