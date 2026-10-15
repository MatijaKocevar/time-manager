"use server"

import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import {
    GetShiftsForPeriodSchema,
    type GetShiftsForPeriodInput,
    type OvertimeUseDay,
} from "../_schemas/shift-schemas"

function formatUtcDateString(date: Date): string {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, "0")
    const day = String(date.getUTCDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

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

export async function getOvertimeUseForPeriod(input: GetShiftsForPeriodInput) {
    await requireAuth()

    const validation = GetShiftsForPeriodSchema.safeParse(input)
    if (!validation.success) {
        return { error: validation.error.issues[0]?.message || "Invalid input" }
    }

    const { startDate, endDate } = validation.data

    try {
        const requests = await prisma.request.findMany({
            where: {
                type: "OVERTIME_USE",
                status: "APPROVED",
                startDate: { lte: endDate },
                endDate: { gte: startDate },
                user: {
                    deactivatedAt: null,
                    anonymizedAt: null,
                },
            },
            select: {
                userId: true,
                startDate: true,
                startTime: true,
                endTime: true,
            },
            orderBy: [{ startDate: "asc" }],
        })

        const overtimeUse: OvertimeUseDay[] = requests.map((request) => ({
            userId: request.userId,
            dateString: formatUtcDateString(request.startDate),
            startTime: request.startTime,
            endTime: request.endTime,
        }))

        return { overtimeUse }
    } catch (error) {
        console.error("Failed to fetch overtime use:", error)
        return { error: "Failed to fetch overtime use" }
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
