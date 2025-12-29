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
    const approvedRequests = await prisma.request.findMany({
        where: {
            userId,
            status: "APPROVED",
            startDate: { lte: endDate },
            endDate: { gte: startDate },
        },
        select: { startDate: true, endDate: true, skipWeekends: true, skipHolidays: true },
    })

    const requestDateSet = new Set<string>()
    for (const req of approvedRequests) {
        for (const date of dateRange(req.startDate, req.endDate)) {
            const dayOfWeek = date.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
            const isHoliday = holidays.some((h) => h.getTime() === date.getTime())

            if ((req.skipWeekends && isWeekend) || (req.skipHolidays && isHoliday)) continue

            const dateKey = normalizeDate(date).toISOString().split("T")[0]
            requestDateSet.add(dateKey)
        }
    }

    const shifts = []
    const locations: ShiftLocation[] = ["OFFICE", "HOME", "OTHER"]
    const locationWeights = [70, 25, 5]

    for (const date of dateRange(startDate, endDate)) {
        if (!isWeekday(date)) continue
        if (holidays.some((h) => h.getTime() === date.getTime())) continue

        const dateKey = normalizeDate(date).toISOString().split("T")[0]
        if (requestDateSet.has(dateKey)) continue

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
