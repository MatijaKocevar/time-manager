"use server"

import { requireAuth } from "@/lib/auth-helpers"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { refreshDailyHourSummary } from "@/lib/materialized-views"
import type { HourType } from "@/../../prisma/generated/client"
import type { TaskDisplay } from "@/app/(protected)/tasks/schemas/task-schemas"
import { TASK_STATUS } from "@/app/(protected)/tasks/constants/task-statuses"

export async function getInProgressTasksForTracker(): Promise<TaskDisplay[]> {
    try {
        const session = await requireAuth()

        const [tasks, latestEntries] = await Promise.all([
            prisma.task.findMany({
                where: {
                    userId: session.user.id,
                    status: TASK_STATUS.IN_PROGRESS,
                    isSystemTask: false,
                },
                select: {
                    id: true,
                    userId: true,
                    listId: true,
                    title: true,
                    description: true,
                    status: true,
                    parentId: true,
                    order: true,
                    isExpanded: true,
                    isSystemTask: true,
                    createdAt: true,
                    updatedAt: true,
                    list: {
                        select: {
                            name: true,
                            color: true,
                            icon: true,
                            isPrivate: true,
                        },
                    },
                },
            }),
            prisma.taskTimeEntry.groupBy({
                by: ["taskId"],
                where: {
                    userId: session.user.id,
                    task: {
                        status: TASK_STATUS.IN_PROGRESS,
                        isSystemTask: false,
                    },
                },
                _max: {
                    startTime: true,
                },
            }),
        ])

        const latestEntryMap = new Map(latestEntries.map((e) => [e.taskId, e._max.startTime]))

        const taskDisplays: TaskDisplay[] = tasks.map((task) => {
            const { list, ...taskData } = task
            return {
                ...taskData,
                listName: list?.name ?? null,
                listColor: list?.color ?? null,
                listIcon: list?.icon ?? null,
                listIsPrivate: list?.isPrivate ?? null,
            }
        })

        return taskDisplays.sort((a, b) => {
            const aList = a.listName ?? ""
            const bList = b.listName ?? ""
            if (aList !== bList) return aList.localeCompare(bList)

            const aLatest = latestEntryMap.get(a.id)
            const bLatest = latestEntryMap.get(b.id)
            if (aLatest && bLatest) return bLatest.getTime() - aLatest.getTime()
            if (aLatest) return -1
            if (bLatest) return 1
            return a.title.localeCompare(b.title)
        })
    } catch {
        return []
    }
}

export async function getTrackerPreferences() {
    try {
        const session = await requireAuth()

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                trackerSelectedType: true,
                trackerSelectedTaskId: true,
            },
        })

        return {
            selectedType: user?.trackerSelectedType ?? "WORK",
            selectedTaskId: user?.trackerSelectedTaskId ?? null,
        }
    } catch {
        return {
            selectedType: "WORK" as HourType,
            selectedTaskId: null,
        }
    }
}

export async function saveTrackerPreferences(
    selectedType: HourType,
    selectedTaskId: string | null
) {
    try {
        const session = await requireAuth()

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                trackerSelectedType: selectedType,
                trackerSelectedTaskId: selectedTaskId,
            },
        })

        return { success: true }
    } catch {
        return { success: false, error: "Failed to save preferences" }
    }
}

export async function getGeneralWorkTask() {
    try {
        const session = await requireAuth()

        const generalTask = await prisma.task.findFirst({
            where: {
                userId: session.user.id,
                title: "System: General Work",
                isSystemTask: true,
            },
        })

        return generalTask
    } catch {
        return null
    }
}

export async function getSystemTaskByType(type: "BREAK" | "PRIVATE") {
    try {
        const session = await requireAuth()
        const title = `System: ${type}`

        const systemTask = await prisma.task.findFirst({
            where: {
                userId: session.user.id,
                title,
                isSystemTask: true,
            },
        })

        return systemTask
    } catch {
        return null
    }
}

export async function getTaskTimeEntries(taskId?: string) {
    try {
        const session = await requireAuth()

        if (!taskId) {
            return []
        }

        const entries = await prisma.taskTimeEntry.findMany({
            where: {
                userId: session.user.id,
                taskId,
            },
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

        return entries
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error("Failed to fetch today's time entries")
    }
}

export async function getTodayTimeSummary() {
    try {
        const session = await requireAuth()

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const entries = await prisma.taskTimeEntry.findMany({
            where: {
                userId: session.user.id,
                startTime: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        })

        const activeTimer = await prisma.taskTimeEntry.findFirst({
            where: {
                userId: session.user.id,
                endTime: null,
            },
            include: {
                task: true,
            },
        })

        const totals = entries.reduce(
            (acc, entry) => {
                const type = entry.type as "WORK" | "BREAK" | "PRIVATE"
                if (type === "WORK" || type === "BREAK" || type === "PRIVATE") {
                    const durationHours = entry.duration ? entry.duration / 3600 : 0
                    acc[type] += durationHours
                }
                return acc
            },
            { WORK: 0, BREAK: 0, PRIVATE: 0 } as Record<"WORK" | "BREAK" | "PRIVATE", number>
        )

        return {
            totals,
            activeTimer: activeTimer
                ? {
                      id: activeTimer.id,
                      startTime: activeTimer.startTime,
                      type: activeTimer.type as HourType,
                  }
                : null,
        }
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error("Failed to fetch today's time summary")
    }
}
