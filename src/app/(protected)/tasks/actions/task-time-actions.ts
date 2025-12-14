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
import { recalculateDailySummaryStandalone } from "@/app/(protected)/hours/utils/summary-helpers"

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

                const entryDate = new Date(existingActiveTimer.startTime)
                const entryDateLocal = new Date(entryDate)
                entryDateLocal.setHours(0, 0, 0, 0)
                const entryDateUTC = new Date(
                    Date.UTC(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
                )

                const approvedRequest = await tx.request.findFirst({
                    where: {
                        userId: session.user.id,
                        status: "APPROVED",
                        affectsHourType: true,
                        startDate: { lte: entryDateUTC },
                        endDate: { gte: entryDateUTC },
                    },
                })

                let hourType: "WORK" | "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "OTHER" = "WORK"
                if (approvedRequest) {
                    switch (approvedRequest.type) {
                        case "VACATION":
                            hourType = "VACATION"
                            break
                        case "SICK_LEAVE":
                            hourType = "SICK_LEAVE"
                            break
                        case "WORK_FROM_HOME":
                        case "REMOTE_WORK":
                            hourType = "WORK_FROM_HOME"
                            break
                        case "OTHER":
                            hourType = "OTHER"
                            break
                    }
                }
                await recalculateDailySummaryStandalone(session.user.id, entryDateLocal, hourType)
            }

            return await tx.taskTimeEntry.create({
                data: {
                    taskId,
                    userId: session.user.id,
                    startTime: new Date(),
                },
            })
        })

        revalidatePath("/tasks")
        revalidatePath("/hours")
        return { success: true, entryId: newEntry.id }
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

        const entryDate = new Date(entry.startTime)
        const entryDateLocal = new Date(entryDate)
        entryDateLocal.setHours(0, 0, 0, 0)
        const entryDateUTC = new Date(
            Date.UTC(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
        )

        const approvedRequest = await prisma.request.findFirst({
            where: {
                userId: session.user.id,
                status: "APPROVED",
                affectsHourType: true,
                startDate: { lte: entryDateUTC },
                endDate: { gte: entryDateUTC },
            },
        })

        let hourType: "WORK" | "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "OTHER" = "WORK"
        if (approvedRequest) {
            switch (approvedRequest.type) {
                case "VACATION":
                    hourType = "VACATION"
                    break
                case "SICK_LEAVE":
                    hourType = "SICK_LEAVE"
                    break
                case "WORK_FROM_HOME":
                case "REMOTE_WORK":
                    hourType = "WORK_FROM_HOME"
                    break
                case "OTHER":
                    hourType = "OTHER"
                    break
            }
        }
        await recalculateDailySummaryStandalone(session.user.id, entryDateLocal, hourType)

        revalidatePath("/tasks")
        revalidatePath("/hours")
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
