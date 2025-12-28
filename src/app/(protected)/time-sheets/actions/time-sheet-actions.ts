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
                startTime: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
                endTime: {
                    not: null,
                },
            },
            select: {
                id: true,
                taskId: true,
                userId: true,
                startTime: true,
                endTime: true,
                duration: true,
                createdAt: true,
                updatedAt: true,
                task: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        listId: true,
                        list: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                                icon: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                startTime: "desc",
            },
        })

        const activeTimer = await prisma.taskTimeEntry.findFirst({
            where: {
                userId: session.user.id,
                endTime: null,
            },
            select: {
                id: true,
                taskId: true,
                userId: true,
                startTime: true,
                endTime: true,
                duration: true,
                createdAt: true,
                updatedAt: true,
                task: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        listId: true,
                        list: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                                icon: true,
                            },
                        },
                    },
                },
            },
        })

        const allEntries = activeTimer ? [activeTimer, ...entries] : entries

        return { success: true, data: allEntries, activeTimer }
    } catch (error) {
        console.error("Error fetching time sheet entries:", error)
        return { error: "Failed to fetch time sheet entries" }
    }
}
