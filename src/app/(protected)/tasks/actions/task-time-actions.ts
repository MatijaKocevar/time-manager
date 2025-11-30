"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import {
    StartTimerSchema,
    StopTimerSchema,
    type StartTimerInput,
    type StopTimerInput,
    type TaskTimeEntryDisplay,
} from "../schemas/task-time-entry-schemas"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

export async function getActiveTimer(): Promise<TaskTimeEntryDisplay | null> {
    try {
        const session = await requireAuth()

        const activeTimer = await prisma.taskTimeEntry.findFirst({
            where: {
                userId: session.user.id,
                endTime: null,
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

        const { taskId } = validation.data

        const task = await prisma.task.findUnique({
            where: { id: taskId },
        })

        if (!task || task.userId !== session.user.id) {
            return { error: "Task not found" }
        }

        const existingTimer = await prisma.taskTimeEntry.findFirst({
            where: {
                taskId,
                userId: session.user.id,
                endTime: null,
            },
        })

        if (existingTimer) {
            return { error: "Timer already running for this task" }
        }

        const entry = await prisma.taskTimeEntry.create({
            data: {
                taskId,
                userId: session.user.id,
                startTime: new Date(),
            },
        })

        revalidatePath("/tasks")
        return { success: true, entryId: entry.id }
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

        const { id } = validation.data

        const entry = await prisma.taskTimeEntry.findUnique({
            where: { id },
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
            where: { id },
            data: {
                endTime,
                duration,
            },
        })

        revalidatePath("/tasks")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to stop timer" }
    }
}

export async function getTaskTimeEntries(taskId: string): Promise<TaskTimeEntryDisplay[]> {
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
            orderBy: { startTime: "desc" },
        })

        return entries
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
