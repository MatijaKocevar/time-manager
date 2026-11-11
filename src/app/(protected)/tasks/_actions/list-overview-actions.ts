"use server"

import { z } from "zod"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { countsTowardWorkHours } from "@/lib/hour-types"
import type { HourType } from "@/../../prisma/generated/client"

const GetListOverviewSchema = z.object({
    listId: z.string().min(1),
})

export type GetListOverviewInput = z.input<typeof GetListOverviewSchema>

export interface ListOverviewData {
    listId: string
    listName: string
    listColor: string | null
    totalHours: number
    workHours: number
    offHoursHours: number
    taskCount: number
    firstEntryAt: Date | null
    lastEntryAt: Date | null
    activeTimer: boolean
}

export type ListOverviewResult = { data: ListOverviewData } | { error: string }

export async function getListOverview(input: GetListOverviewInput): Promise<ListOverviewResult> {
    try {
        const session = await requireAuth()
        const validation = GetListOverviewSchema.safeParse(input)

        if (!validation.success) {
            return { error: validation.error.message }
        }

        const { listId } = validation.data

        const list = await prisma.list.findUnique({
            where: { id: listId },
            select: { id: true, name: true, color: true, userId: true },
        })

        if (!list || list.userId !== session.user.id) {
            return { error: "List not found" }
        }

        const [groups, taskCount, range, activeTimer] = await Promise.all([
            prisma.taskTimeEntry.groupBy({
                by: ["type"],
                where: {
                    userId: session.user.id,
                    endTime: { not: null },
                    task: { listId },
                },
                _sum: { duration: true },
            }),
            prisma.task.count({
                where: { userId: session.user.id, listId },
            }),
            prisma.taskTimeEntry.aggregate({
                where: {
                    userId: session.user.id,
                    endTime: { not: null },
                    task: { listId },
                },
                _min: { startTime: true },
                _max: { endTime: true },
            }),
            prisma.taskTimeEntry.findFirst({
                where: {
                    userId: session.user.id,
                    endTime: null,
                    task: { listId },
                },
                select: { id: true },
            }),
        ])

        const totalSeconds = groups.reduce((sum, group) => sum + (group._sum.duration ?? 0), 0)
        const workSeconds = groups.reduce(
            (sum, group) =>
                countsTowardWorkHours(group.type as HourType)
                    ? sum + (group._sum.duration ?? 0)
                    : sum,
            0
        )

        return {
            data: {
                listId: list.id,
                listName: list.name,
                listColor: list.color,
                totalHours: totalSeconds / 3600,
                workHours: workSeconds / 3600,
                offHoursHours: (totalSeconds - workSeconds) / 3600,
                taskCount,
                firstEntryAt: range._min.startTime,
                lastEntryAt: range._max.endTime,
                activeTimer: Boolean(activeTimer),
            },
        }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to load list overview" }
    }
}
