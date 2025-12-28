"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GetShiftsForPeriodSchema, type GetShiftsForPeriodInput } from "../schemas/shift-schemas"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
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
