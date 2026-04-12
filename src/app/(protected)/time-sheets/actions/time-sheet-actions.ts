"use server"

import { unstable_cache } from "next/cache"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import {
    GetTimeSheetEntriesSchema,
    type GetTimeSheetEntriesInput,
    GetDayEntriesSchema,
    type GetDayEntriesInput,
} from "../schemas/time-sheet-schemas"

async function fetchTimeSheetEntriesFromDb(
    userId: string,
    startDate: string,
    endDate: string,
    taskFilter: "work" | "private"
) {
    return await prisma.taskTimeEntry.findMany({
        where: {
            userId,
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
            AND: [
                {
                    OR: [
                        {
                            task: { isSystemTask: true },
                            type:
                                taskFilter === "private"
                                    ? { in: ["PRIVATE", "BREAK"] }
                                    : { notIn: ["PRIVATE", "BREAK"] },
                        },
                        {
                            task: {
                                list: {
                                    isPrivate: taskFilter === "private" ? true : false,
                                },
                            },
                        },
                    ],
                },
            ],
        },
        orderBy: { startTime: "asc" },
        select: {
            id: true,
            taskId: true,
            startTime: true,
            endTime: true,
            duration: true,
            type: true,
            task: {
                select: {
                    title: true,
                    status: true,
                    isSystemTask: true,
                    list: {
                        select: {
                            name: true,
                            color: true,
                            icon: true,
                            isPrivate: true,
                        },
                    },
                },
            },
        },
    })
}

export async function getTimeSheetEntries(input: GetTimeSheetEntriesInput) {
    const session = await requireAuth()

    const validation = GetTimeSheetEntriesSchema.safeParse(input)
    if (!validation.success) {
        return { error: validation.error.message }
    }

    const { startDate, endDate, taskFilter } = validation.data

    try {
        const getCachedEntries = unstable_cache(
            async () =>
                fetchTimeSheetEntriesFromDb(session.user.id, startDate, endDate, taskFilter),
            [`time-sheets-${session.user.id}-${startDate}-${endDate}-${taskFilter}`],
            {
                revalidate: 300,
            }
        )

        const entries = await getCachedEntries()

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

export async function getDayEntries(input: GetDayEntriesInput) {
    const session = await requireAuth()

    const validation = GetDayEntriesSchema.safeParse(input)
    if (!validation.success) {
        return { error: validation.error.message }
    }

    const { date, type } = validation.data

    try {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const entries = await prisma.taskTimeEntry.findMany({
            where: {
                userId: session.user.id,
                startTime: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                ...(type && { type }),
            },
            orderBy: { startTime: "asc" },
            select: {
                id: true,
                taskId: true,
                startTime: true,
                endTime: true,
                duration: true,
                type: true,
                task: {
                    select: {
                        title: true,
                    },
                },
            },
        })

        return { success: true, data: entries }
    } catch (error) {
        console.error("Error fetching day entries:", error)
        return { error: "Failed to fetch day entries" }
    }
}
