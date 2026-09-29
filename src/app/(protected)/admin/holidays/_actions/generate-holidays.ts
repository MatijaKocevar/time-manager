"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { getNonWorkFreeNameSets, getWorkFreeHolidays } from "@/lib/si-holidays"

function parseHolidayDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Date(Date.UTC(year, month - 1, day))
}

export async function importWorkFreeHolidays(year: number) {
    try {
        await requireAdmin()

        const holidays = getWorkFreeHolidays(year)

        if (holidays.length === 0) {
            return { success: false, error: "No holidays found", created: 0 }
        }

        const nonWorkFreeNames = getNonWorkFreeNameSets()

        await prisma.holiday.deleteMany({
            where: {
                date: {
                    gte: new Date(Date.UTC(year, 0, 1)),
                    lte: new Date(Date.UTC(year, 11, 31)),
                },
                OR: [
                    { name: { in: [...nonWorkFreeNames.english] } },
                    { description: { in: [...nonWorkFreeNames.slovenian] } },
                ],
            },
        })

        let created = 0

        for (const holiday of holidays) {
            const date = parseHolidayDate(holiday.date)
            const data = {
                name: holiday.nameEn,
                description: holiday.nameSl !== holiday.nameEn ? holiday.nameSl : null,
                isRecurring: true,
            }

            const existing = await prisma.holiday.findUnique({
                where: { date },
            })

            if (existing) {
                await prisma.holiday.update({ where: { date }, data })
            } else {
                await prisma.holiday.create({ data: { date, ...data } })
                created++
            }
        }

        revalidatePath("/admin/holidays")
        revalidatePath("/hours")
        revalidatePath("/shifts")

        return {
            success: true,
            created,
            message: `Imported ${created} holidays for ${year}`,
            error: null,
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMsg, created: 0 }
    }
}

export async function autoGenerateUpcomingHolidays() {
    try {
        const currentYear = new Date().getFullYear()
        const nextYear = currentYear + 1

        const currentYearResult = await importWorkFreeHolidays(currentYear)
        const nextYearResult = await importWorkFreeHolidays(nextYear)

        const errors = []
        if (!currentYearResult.success && currentYearResult.error) {
            errors.push(`${currentYear}: ${currentYearResult.error}`)
        }
        if (!nextYearResult.success && nextYearResult.error) {
            errors.push(`${nextYear}: ${nextYearResult.error}`)
        }

        const total = (currentYearResult.created || 0) + (nextYearResult.created || 0)

        if (errors.length > 0) {
            const errorMsg = errors.join(" | ")
            return {
                success: false,
                error: errorMsg,
                currentYear: currentYearResult,
                nextYear: nextYearResult,
                total,
            }
        }

        return {
            success: true,
            currentYear: currentYearResult,
            nextYear: nextYearResult,
            total,
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        return {
            success: false,
            error: errorMsg,
            currentYear: { success: false, error: errorMsg, created: 0 },
            nextYear: { success: false, error: errorMsg, created: 0 },
            total: 0,
        }
    }
}
