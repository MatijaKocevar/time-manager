"use server"

import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { GetShiftsForPeriodSchema, type GetShiftsForPeriodInput } from "../_schemas/shift-schemas"

export async function getShiftsForPeriod(input: GetShiftsForPeriodInput) {
    await requireAuth()

    const validation = GetShiftsForPeriodSchema.safeParse(input)
    if (!validation.success) {
        return { error: validation.error.issues[0]?.message || "Invalid input" }
    }

    const { startDate, endDate } = validation.data

    try {
        const shifts = await prisma.shift.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                user: {
                    deactivatedAt: null,
                    anonymizedAt: null,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        workStartTime: true,
                        workEndTime: true,
                        workHoursPerDay: true,
                    },
                },
            },
            orderBy: [{ date: "asc" }, { user: { name: "asc" } }],
        })

        return { shifts }
    } catch (error) {
        console.error("Failed to fetch shifts:", error)
        return { error: "Failed to fetch shifts" }
    }
}

export async function getAllUsers() {
    await requireAuth()

    try {
        const users = await prisma.user.findMany({
            where: {
                deactivatedAt: null,
                anonymizedAt: null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                workStartTime: true,
                workEndTime: true,
                workHoursPerDay: true,
            },
            orderBy: {
                name: "asc",
            },
        })

        return { users }
    } catch (error) {
        console.error("Failed to fetch users:", error)
        return { error: "Failed to fetch users" }
    }
}
