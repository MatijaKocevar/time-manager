"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth-helpers"
import { syncWorkFreeHolidays } from "@/lib/holiday-sync"
import { prisma } from "@/lib/prisma"
import { getWorkFreeHolidays } from "@/lib/si-holidays"

export async function importWorkFreeHolidays(year: number) {
    try {
        await requireAdmin()

        if (getWorkFreeHolidays(year).length === 0) {
            return { success: false, error: "No holidays found", created: 0 }
        }

        const result = await syncWorkFreeHolidays(prisma, [year])

        revalidatePath("/admin/holidays")
        revalidatePath("/hours")
        revalidatePath("/shifts")

        return {
            success: true,
            created: result.created,
            message: `Imported ${result.created} holidays for ${year}`,
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
