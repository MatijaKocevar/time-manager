"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import { refreshDailyHourSummary } from "@/lib/materialized-views"
import type { HourType } from "@/../../prisma/generated/client"
import {
    getOrCreateSystemTask,
    isBreakOrPrivate,
    type SystemTaskType,
} from "../utils/system-task-helpers"
import { sseManager } from "@/lib/sse-manager"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
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
    } catch (error) {
        console.error("Failed to save tracker preferences:", error)
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

export interface StartTrackingInput {
    type: HourType
    taskId?: string
}

export interface StopTrackingInput {
    entryId: string
}

export async function startTracking(input: StartTrackingInput) {
    try {
        const session = await requireAuth()

        const { type, taskId } = input

        if (!type) {
            return { error: "Type is required" }
        }

        if ((type === "BREAK" || type === "PRIVATE") && taskId) {
            return { error: "Task should not be provided for break/private type" }
        }

        if (taskId) {
            const task = await prisma.task.findUnique({
                where: { id: taskId },
            })

            if (!task || task.userId !== session.user.id) {
                return { error: "Task not found" }
            }
        }

        const newEntry = await prisma.$transaction(async (tx) => {
            const existingActiveTimer = await tx.taskTimeEntry.findFirst({
                where: {
                    userId: session.user.id,
                    endTime: null,
                },
            })

            if (existingActiveTimer) {
                const endTime = new Date()
                const duration = Math.floor(
                    (endTime.getTime() - existingActiveTimer.startTime.getTime()) / 1000
                )

                await tx.taskTimeEntry.update({
                    where: { id: existingActiveTimer.id },
                    data: {
                        endTime,
                        duration,
                    },
                })
            }

            let finalTaskId = taskId

            if (isBreakOrPrivate(type)) {
                const systemTask = await getOrCreateSystemTask(
                    tx,
                    session.user.id,
                    type as SystemTaskType
                )
                finalTaskId = systemTask.id
            } else if (type === "WORK" && !taskId) {
                const generalWorkTask = await getOrCreateSystemTask(
                    tx,
                    session.user.id,
                    "GENERAL_WORK"
                )
                finalTaskId = generalWorkTask.id
            }

            if (!finalTaskId) {
                throw new Error("Task ID is required")
            }

            const entry = await tx.taskTimeEntry.create({
                data: {
                    taskId: finalTaskId,
                    userId: session.user.id,
                    startTime: new Date(),
                    type,
                },
            })

            return { entry, taskId: finalTaskId }
        })

        await refreshDailyHourSummary()
        revalidatePath("/tracker")
        revalidatePath("/tasks")
        revalidatePath("/hours")

        console.log(`[Tracker Action] Starting timer broadcast for user ${session.user.id}`)
        console.log(
            `[Tracker Action] Connection count:`,
            sseManager.getConnectionCount(session.user.id)
        )

        // Broadcast asynchronously so response can complete first
        setImmediate(() => {
            console.log(
                `[Tracker Action] Executing delayed broadcast, connection count now:`,
                sseManager.getConnectionCount(session.user.id)
            )
            sseManager.broadcast(session.user.id, "timer-started", {
                entryId: newEntry.entry.id,
                taskId: newEntry.taskId,
                startTime: newEntry.entry.startTime,
                type,
            })
        })

        return { success: true, entryId: newEntry.entry.id }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to start tracking" }
    }
}

export async function stopTracking(input: StopTrackingInput) {
    try {
        const session = await requireAuth()

        const { entryId } = input

        const entry = await prisma.taskTimeEntry.findUnique({
            where: { id: entryId },
        })

        if (!entry || entry.userId !== session.user.id) {
            return { error: "Timer entry not found" }
        }

        if (entry.endTime) {
            return { error: "Timer already stopped" }
        }

        const endTime = new Date()
        const duration = Math.floor((endTime.getTime() - entry.startTime.getTime()) / 1000)

        await prisma.taskTimeEntry.update({
            where: { id: entryId },
            data: {
                endTime,
                duration,
            },
        })

        await refreshDailyHourSummary()
        revalidatePath("/tracker")
        revalidatePath("/tasks")
        revalidatePath("/hours")

        console.log(`[Tracker Action] Stopping timer broadcast for user ${session.user.id}`)
        console.log(
            `[Tracker Action] Connection count:`,
            sseManager.getConnectionCount(session.user.id)
        )

        sseManager.broadcast(session.user.id, "timer-stopped", {
            entryId,
            duration,
        })

        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to stop tracking" }
    }
}

export async function getActiveTrackingEntry() {
    try {
        const session = await requireAuth()

        const activeEntry = await prisma.taskTimeEntry.findFirst({
            where: {
                userId: session.user.id,
                endTime: null,
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

        return activeEntry
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error("Failed to fetch active tracking entry")
    }
}

export async function getTodayTimeEntries(type?: HourType, taskId?: string) {
    try {
        const session = await requireAuth()

        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)

        const where: {
            userId: string
            startTime: { gte: Date; lte: Date }
            type?: HourType
            taskId?: string
        } = {
            userId: session.user.id,
            startTime: {
                gte: startOfDay,
                lte: endOfDay,
            },
        }

        if (type) {
            where.type = type
        }

        if (taskId) {
            where.taskId = taskId
        }

        const entries = await prisma.taskTimeEntry.findMany({
            where,
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
