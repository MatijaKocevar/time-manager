"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
    UpdateShiftSchema,
    UpdateUserShiftSchema,
    GetShiftsForPeriodSchema,
    type UpdateShiftInput,
    type UpdateUserShiftInput,
    type GetShiftsForPeriodInput,
} from "../schemas/shift-schemas"
import { revalidatePath } from "next/cache"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

async function requireAdmin() {
    const session = await requireAuth()
    if (session.user.role !== "ADMIN") {
        throw new Error("Forbidden: Admin access required")
    }
    return session
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
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
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
            select: {
                id: true,
                name: true,
                email: true,
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

export async function updateMyShift(input: UpdateShiftInput) {
    const session = await requireAuth()

    const validation = UpdateShiftSchema.safeParse(input)
    if (!validation.success) {
        return { error: validation.error.issues[0]?.message || "Invalid input" }
    }

    const { date, location, notes } = validation.data

    try {
        const shift = await prisma.shift.upsert({
            where: {
                userId_date: {
                    userId: session.user.id,
                    date,
                },
            },
            update: {
                location,
                notes,
            },
            create: {
                userId: session.user.id,
                date,
                location,
                notes,
            },
        })

        revalidatePath("/shifts")
        return { success: true, shift }
    } catch (error) {
        console.error("Failed to update shift:", error)
        return { error: "Failed to update shift" }
    }
}

export async function updateUserShift(input: UpdateUserShiftInput) {
    await requireAdmin()

    const validation = UpdateUserShiftSchema.safeParse(input)
    if (!validation.success) {
        return { error: validation.error.issues[0]?.message || "Invalid input" }
    }

    const { userId, date, location, notes } = validation.data

    try {
        const shift = await prisma.shift.upsert({
            where: {
                userId_date: {
                    userId,
                    date,
                },
            },
            update: {
                location,
                notes,
            },
            create: {
                userId,
                date,
                location,
                notes,
            },
        })

        revalidatePath("/shifts")
        return { success: true, shift }
    } catch (error) {
        console.error("Failed to update user shift:", error)
        return { error: "Failed to update user shift" }
    }
}
