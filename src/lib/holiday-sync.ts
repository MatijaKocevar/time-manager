import type { PrismaClient } from "../../prisma/generated/client"
import { getNonWorkFreeNameSets, getWorkFreeHolidays } from "./si-holidays"

const DAY_MS = 24 * 60 * 60 * 1000

export function parseHolidayDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Date(Date.UTC(year, month - 1, day))
}

export function toHolidayDay(date: Date): Date {
    const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

    if (date.getUTCHours() >= 12) {
        day.setUTCDate(day.getUTCDate() + 1)
    }

    return day
}

export interface HolidaySyncResult {
    created: number
    updated: number
    removed: number
    normalized: number
}

export async function syncWorkFreeHolidays(
    prisma: PrismaClient,
    years: number[]
): Promise<HolidaySyncResult> {
    const nonWorkFreeNames = getNonWorkFreeNameSets()

    const nonWorkFree = await prisma.holiday.deleteMany({
        where: {
            OR: [
                { name: { in: [...nonWorkFreeNames.english] } },
                { description: { in: [...nonWorkFreeNames.slovenian] } },
            ],
        },
    })

    const result: HolidaySyncResult = {
        created: 0,
        updated: 0,
        removed: nonWorkFree.count,
        normalized: 0,
    }

    for (const year of years) {
        const holidays = getWorkFreeHolidays(year)

        if (holidays.length === 0) continue

        const existing = await prisma.holiday.findMany({
            where: {
                date: {
                    gte: new Date(Date.UTC(year, 0, 1) - DAY_MS),
                    lt: new Date(Date.UTC(year + 1, 0, 1) + DAY_MS),
                },
            },
            orderBy: { updatedAt: "desc" },
        })

        const rowsByDay = new Map<number, typeof existing>()

        for (const row of existing) {
            const day = toHolidayDay(row.date).getTime()
            rowsByDay.set(day, [...(rowsByDay.get(day) ?? []), row])
        }

        for (const holiday of holidays) {
            const date = parseHolidayDate(holiday.date)
            const matches = rowsByDay.get(date.getTime()) ?? []
            const data = {
                name: holiday.nameEn,
                description: holiday.nameSl !== holiday.nameEn ? holiday.nameSl : null,
                isRecurring: true,
            }

            if (matches.length === 0) {
                await prisma.holiday.create({ data: { date, ...data } })
                result.created++
                continue
            }

            await prisma.holiday.update({ where: { id: matches[0].id }, data: { date, ...data } })
            result.updated++

            if (matches.length > 1) {
                const deleted = await prisma.holiday.deleteMany({
                    where: { id: { in: matches.slice(1).map((row) => row.id) } },
                })

                result.removed += deleted.count
            }
        }
    }

    await normalizeHolidayDays(prisma, result)

    return result
}

async function normalizeHolidayDays(prisma: PrismaClient, result: HolidaySyncResult) {
    const holidays = await prisma.holiday.findMany({ orderBy: { updatedAt: "desc" } })
    const rowsByDay = new Map<number, typeof holidays>()

    for (const row of holidays) {
        const day = toHolidayDay(row.date).getTime()
        rowsByDay.set(day, [...(rowsByDay.get(day) ?? []), row])
    }

    for (const [day, rows] of rowsByDay) {
        const canonical = new Date(day)
        const [keep, ...duplicates] = rows

        if (duplicates.length > 0) {
            const deleted = await prisma.holiday.deleteMany({
                where: { id: { in: duplicates.map((row) => row.id) } },
            })

            result.removed += deleted.count
        }

        if (keep.date.getTime() !== canonical.getTime()) {
            await prisma.holiday.update({ where: { id: keep.id }, data: { date: canonical } })
            result.normalized++
        }
    }
}
