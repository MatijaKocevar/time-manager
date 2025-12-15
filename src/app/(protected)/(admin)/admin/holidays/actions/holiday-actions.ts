"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import {
    CreateHolidaySchema,
    UpdateHolidaySchema,
    DeleteHolidaySchema,
    type CreateHolidayInput,
    type UpdateHolidayInput,
    type DeleteHolidayInput,
} from "../schemas"

async function requireAdmin() {
    const session = await getServerSession(authConfig)
    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized - Admin access required")
    }
    return session
}

export async function getHolidays(startDate?: Date, endDate?: Date) {
    try {
        await requireAdmin()

        const holidays = await prisma.holiday.findMany({
            where: {
                ...(startDate && endDate
                    ? {
                          date: {
                              gte: startDate,
                              lte: endDate,
                          },
                      }
                    : {}),
            },
            orderBy: {
                date: "asc",
            },
        })

        return { success: true, data: holidays }
    } catch (error) {
        console.error("Error fetching holidays:", error)
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: "Failed to fetch holidays" }
    }
}

export async function getAllHolidays() {
    try {
        const holidays = await prisma.holiday.findMany({
            orderBy: {
                date: "asc",
            },
        })

        return holidays
    } catch (error) {
        console.error("Error fetching holidays:", error)
        return []
    }
}

export async function getHolidayById(id: string) {
    try {
        await requireAdmin()

        const holiday = await prisma.holiday.findUnique({
            where: { id },
        })

        if (!holiday) {
            throw new Error("Holiday not found")
        }

        return holiday
    } catch (error) {
        console.error("Error fetching holiday:", error)
        throw error
    }
}

export async function createHoliday(input: CreateHolidayInput) {
    try {
        await requireAdmin()

        const validation = CreateHolidaySchema.safeParse(input)
        if (!validation.success) {
            return { success: false, error: validation.error.issues[0].message }
        }

        const { date, name, description, isRecurring } = validation.data

        const normalizedDate = new Date(date)
        normalizedDate.setHours(0, 0, 0, 0)

        const existing = await prisma.holiday.findUnique({
            where: { date: normalizedDate },
        })

        if (existing) {
            return { success: false, error: "A holiday already exists on this date" }
        }

        await prisma.holiday.create({
            data: {
                date: normalizedDate,
                name,
                description,
                isRecurring,
            },
        })

        revalidatePath("/admin/holidays")
        revalidatePath("/hours")
        revalidatePath("/shifts")

        return { success: true }
    } catch (error) {
        console.error("Error creating holiday:", error)
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: "Failed to create holiday" }
    }
}

export async function updateHoliday(input: UpdateHolidayInput) {
    try {
        await requireAdmin()

        const validation = UpdateHolidaySchema.safeParse(input)
        if (!validation.success) {
            return { success: false, error: validation.error.issues[0].message }
        }

        const { id, date, name, description, isRecurring } = validation.data

        const existing = await prisma.holiday.findUnique({
            where: { id },
        })

        if (!existing) {
            return { success: false, error: "Holiday not found" }
        }

        const normalizedDate = new Date(date)
        normalizedDate.setHours(0, 0, 0, 0)

        if (normalizedDate.getTime() !== existing.date.getTime()) {
            const dateConflict = await prisma.holiday.findUnique({
                where: { date: normalizedDate },
            })

            if (dateConflict && dateConflict.id !== id) {
                return { success: false, error: "A holiday already exists on this date" }
            }
        }

        await prisma.holiday.update({
            where: { id },
            data: {
                date: normalizedDate,
                name,
                description,
                isRecurring,
            },
        })

        revalidatePath("/admin/holidays")
        revalidatePath("/hours")
        revalidatePath("/shifts")

        return { success: true }
    } catch (error) {
        console.error("Error updating holiday:", error)
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: "Failed to update holiday" }
    }
}

export async function deleteHoliday(input: DeleteHolidayInput) {
    try {
        await requireAdmin()

        const validation = DeleteHolidaySchema.safeParse(input)
        if (!validation.success) {
            return { success: false, error: validation.error.issues[0].message }
        }

        const { id } = validation.data

        const existing = await prisma.holiday.findUnique({
            where: { id },
        })

        if (!existing) {
            return { success: false, error: "Holiday not found" }
        }

        await prisma.holiday.delete({
            where: { id },
        })

        revalidatePath("/admin/holidays")
        revalidatePath("/hours")
        revalidatePath("/shifts")

        return { success: true }
    } catch (error) {
        console.error("Error deleting holiday:", error)
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: "Failed to delete holiday" }
    }
}

export async function getHolidaysInRange(startDate: string, endDate: string) {
    try {
        const session = await getServerSession(authConfig)
        if (!session?.user) {
            throw new Error("Unauthorized")
        }

        const start = new Date(startDate)
        start.setDate(start.getDate() - 1)

        const end = new Date(endDate)
        end.setDate(end.getDate() + 1)

        const holidays = await prisma.holiday.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end,
                },
            },
            orderBy: {
                date: "asc",
            },
        })

        return holidays
    } catch (error) {
        console.error("Error fetching holidays:", error)
        return []
    }
}
