"use server"

import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import {
    broadcastTimerEvent,
    stopActiveTimer,
    determineHourType,
    refreshTimerData,
    type TimerBroadcastData,
} from "@/lib/timer-utils"
import {
    getOrCreateSystemTask,
    type SystemTaskType,
} from "@/app/(protected)/tracker/utils/system-task-helpers"
import {
    StartTimerSchema,
    StopTimerSchema,
    type StartTimerInput,
    type StopTimerInput,
    type TimerDisplay,
} from "../schemas/timer-schemas"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

export async function getActiveTimer(): Promise<TimerDisplay | null> {
    try {
        const session = await requireAuth()

        const activeTimer = await prisma.taskTimeEntry.findFirst({
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

        return activeTimer
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error("Failed to fetch active timer")
    }
}

export async function startTimer(input: StartTimerInput) {
    try {
        const session = await requireAuth()

        const validation = StartTimerSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { type = "WORK", taskId } = validation.data

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
            await stopActiveTimer(tx, session.user.id)

            let finalTaskId = taskId

            if (type === "BREAK" || type === "PRIVATE") {
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

            const isBreak = type === "BREAK"
            const isPrivate = type === "PRIVATE"
            const finalType = await determineHourType(tx, session.user.id, type, isBreak, isPrivate)

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

        await refreshTimerData()

        const broadcastData: TimerBroadcastData = {
            entryId: newEntry.entry.id,
            taskId: newEntry.taskId,
            startTime: newEntry.entry.startTime,
            type: newEntry.entry.type,
        }

        await broadcastTimerEvent(session.user.id, "timer-started", broadcastData)

        return { success: true, entryId: newEntry.entry.id }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to start timer" }
    }
}

export async function stopTimer(input: StopTimerInput) {
    try {
        const session = await requireAuth()

        const validation = StopTimerSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { id: entryId } = validation.data

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

        await refreshTimerData()

        const broadcastData: TimerBroadcastData = {
            entryId,
            duration,
        }

        await broadcastTimerEvent(session.user.id, "timer-stopped", broadcastData)

        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to stop timer" }
    }
}
