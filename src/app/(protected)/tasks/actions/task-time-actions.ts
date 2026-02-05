"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import type { HourType } from "@/../../prisma/generated/client"
import {
    UpdateTaskTimeEntrySchema,
    DeleteTaskTimeEntrySchema,
    type UpdateTaskTimeEntryInput,
    type DeleteTaskTimeEntryInput,
} from "../schemas/task-time-entry-schemas"
import { broadcastTimerEvent, refreshTimerData, type TimerBroadcastData } from "@/lib/timer-utils"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

export async function getTaskTimeEntries(taskId: string) {
    try {
        const session = await requireAuth()

        const task = await prisma.task.findUnique({
            where: { id: taskId },
        })

        if (!task || task.userId !== session.user.id) {
            throw new Error("Task not found")
        }

        const entries = await prisma.taskTimeEntry.findMany({
            where: { taskId },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                        isSystemTask: true,
                    },
                },
            },
            orderBy: { startTime: "desc" },
        })

        const descendantIds = await prisma.$queryRaw<Array<{ id: string }>>`
            WITH RECURSIVE task_tree AS (
                SELECT id, "parentId"
                FROM "Task"
                WHERE "parentId" = ${taskId}
                
                UNION ALL
                
                SELECT t.id, t."parentId"
                FROM "Task" t
                INNER JOIN task_tree tt ON t."parentId" = tt.id
            )
            SELECT id FROM task_tree
        `

        let childAggregation = null
        if (descendantIds.length > 0) {
            const childIds = descendantIds.map((d) => d.id)
            const childTimeResult = await prisma.taskTimeEntry.aggregate({
                where: {
                    taskId: { in: childIds },
                    endTime: { not: null },
                },
                _sum: {
                    duration: true,
                },
            })

            const aggregatedDuration = childTimeResult._sum.duration ?? 0
            if (aggregatedDuration > 0) {
                childAggregation = {
                    isAggregation: true as const,
                    aggregatedDuration,
                }
            }
        }

        return { entries, childAggregation }
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error("Failed to fetch time entries")
    }
}

export async function getTotalTaskTime(taskId: string): Promise<number> {
    try {
        const session = await requireAuth()

        const task = await prisma.task.findUnique({
            where: { id: taskId },
        })

        if (!task || task.userId !== session.user.id) {
            throw new Error("Task not found")
        }

        const entries = await prisma.taskTimeEntry.findMany({
            where: {
                taskId,
                endTime: { not: null },
            },
            select: { duration: true },
        })

        const total = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0)

        return total
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error("Failed to calculate total time")
    }
}

export async function updateTaskTimeEntry(input: UpdateTaskTimeEntryInput) {
    try {
        const session = await requireAuth()

        const validation = UpdateTaskTimeEntrySchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { id, startTime, endTime } = validation.data

        const existing = await prisma.taskTimeEntry.findUnique({
            where: { id },
        })

        if (!existing || existing.userId !== session.user.id) {
            return { error: "Time entry not found" }
        }

        if (endTime && startTime >= endTime) {
            return { error: "Start time must be before end time" }
        }

        if (startTime > new Date()) {
            return { error: "Start time cannot be in the future" }
        }

        if (endTime && endTime > new Date()) {
            return { error: "End time cannot be in the future" }
        }

        let duration = existing.duration
        if (endTime) {
            duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
        } else if (existing.endTime) {
            duration = Math.floor((existing.endTime.getTime() - startTime.getTime()) / 1000)
        }

        await prisma.$transaction(async (tx) => {
            await tx.taskTimeEntry.update({
                where: { id },
                data: {
                    startTime,
                    endTime: endTime !== undefined ? endTime : existing.endTime,
                    duration,
                },
            })
        })

        await refreshTimerData()

        const broadcastData: TimerBroadcastData = {
            entryId: id,
            startTime,
            duration,
        }

        await broadcastTimerEvent(session.user.id, "time-entry-updated", broadcastData)

        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to update time entry" }
    }
}

export async function deleteTaskTimeEntry(input: DeleteTaskTimeEntryInput) {
    try {
        const session = await requireAuth()

        const validation = DeleteTaskTimeEntrySchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { id } = validation.data

        const existing = await prisma.taskTimeEntry.findUnique({
            where: { id },
        })

        if (!existing || existing.userId !== session.user.id) {
            return { error: "Time entry not found" }
        }

        const entryDate = new Date(existing.startTime)
        entryDate.setHours(0, 0, 0, 0)

        await prisma.$transaction(async (tx) => {
            await tx.taskTimeEntry.delete({
                where: { id },
            })
        })

        await refreshTimerData()

        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to delete time entry" }
    }
}
