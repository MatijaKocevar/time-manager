"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
    GetTimeSheetEntriesSchema,
    type GetTimeSheetEntriesInput,
} from "../schemas/time-sheet-schemas"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

export async function getTimeSheetEntries(input: GetTimeSheetEntriesInput) {
    const session = await requireAuth()

    const validation = GetTimeSheetEntriesSchema.safeParse(input)
    if (!validation.success) {
        return { error: validation.error.message }
    }

    const { startDate, endDate } = validation.data

    try {
        const entries = await prisma.taskTimeEntry.findMany({
            where: {
                userId: session.user.id,
                OR: [
                    {
                        startTime: {
                            gte: new Date(startDate),
                            lt: new Date(new Date(endDate).getTime() + 86400000),
                        },
                        endTime: { not: null },
                    },
                    {
                        endTime: null,
                    },
                ],
            },
            select: {
                id: true,
                taskId: true,
                startTime: true,
                endTime: true,
                duration: true,
                task: {
                    select: {
                        title: true,
                        status: true,
                        list: {
                            select: {
                                name: true,
                                color: true,
                                icon: true,
                            },
                        },
                    },
                },
            },
        })

        const activeTimer = entries.find((e) => e.endTime === null)
        const allEntries = entries.map((entry) => ({
            ...entry,
            userId: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        }))

        return { success: true, data: allEntries, activeTimer }
    } catch (error) {
        console.error("Error fetching time sheet entries:", error)
        return { error: "Failed to fetch time sheet entries" }
    }
}
