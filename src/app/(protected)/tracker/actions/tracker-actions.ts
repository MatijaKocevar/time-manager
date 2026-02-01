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
import { getPusherServer } from "@/lib/pusher-server"

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

            let finalType = type

            if (finalType === "WORK") {
                const now = new Date()

                const approvedRequests = await tx.request.findMany({
                    where: {
                        userId: session.user.id,
                        status: "APPROVED",
                        affectsHourType: true,
                        cancelledAt: null,
                        type: {
                            notIn: ["VACATION", "SICK_LEAVE"],
                        },
                    },
                    orderBy: {
                        approvedAt: "desc",
                    },
                })

                for (const request of approvedRequests) {
                    let requestStart: Date
                    let requestEnd: Date

                    if (request.isFullDay || !request.startTime || !request.endTime) {
                        requestStart = new Date(request.startDate)
                        requestStart.setUTCHours(0, 0, 0, 0)
                        requestEnd = new Date(request.endDate)
                        requestEnd.setUTCHours(23, 59, 59, 999)
                    } else {
                        const [startHour, startMin] = request.startTime.split(":").map(Number)
                        const [endHour, endMin] = request.endTime.split(":").map(Number)
                        requestStart = new Date(request.startDate)
                        requestStart.setUTCHours(startHour, startMin, 0, 0)
                        requestEnd = new Date(request.endDate)
                        requestEnd.setUTCHours(endHour, endMin, 0, 0)
                    }

                    if (now >= requestStart && now <= requestEnd) {
                        finalType = request.type
                        break
                    }
                }
            }

            const entry = await tx.taskTimeEntry.create({
                data: {
                    taskId: finalTaskId,
                    userId: session.user.id,
                    startTime: new Date(),
                    type: finalType,
                },
            })

            return { entry, taskId: finalTaskId }
        })

        await refreshDailyHourSummary()
        revalidatePath("/tracker")
        revalidatePath("/tasks")
        revalidatePath("/hours")
        revalidatePath("/time-sheets")

        setImmediate(() => {
            const broadcastData = {
                entryId: newEntry.entry.id,
                taskId: newEntry.taskId,
                startTime: newEntry.entry.startTime,
                type,
            }

            sseManager.broadcast(session.user.id, "timer-started", broadcastData)

            if (process.env.VERCEL) {
                const pusher = getPusherServer()
                if (pusher) {
                    pusher.trigger(
                        `private-user-${session.user.id}`,
                        "timer-started",
                        broadcastData
                    )
                }
            }
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
        revalidatePath("/time-sheets")

        const broadcastData = {
            entryId,
            duration,
        }

        sseManager.broadcast(session.user.id, "timer-stopped", broadcastData)

        if (process.env.VERCEL) {
            const pusher = getPusherServer()
            if (pusher) {
                pusher.trigger(`private-user-${session.user.id}`, "timer-stopped", broadcastData)
            }
        }

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
