"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import {
    StartTimerSchema,
    StopTimerSchema,
    UpdateTaskTimeEntrySchema,
    DeleteTaskTimeEntrySchema,
    type StartTimerInput,
    type StopTimerInput,
    type UpdateTaskTimeEntryInput,
    type DeleteTaskTimeEntryInput,
    type TaskTimeEntryDisplay,
} from "../schemas/task-time-entry-schemas"
import { refreshDailyHourSummary } from "@/lib/materialized-views"

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
                        cancelledAt: null,
                        startDate: { lte: entryDateUTC },
                        endDate: { gte: entryDateUTC },
                    },
                    orderBy: {
                        approvedAt: "desc",
                    },
                })

                let hourType: "WORK" | "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "OTHER" =
                    "WORK"
                if (approvedRequest) {
                    hourType = approvedRequest.type
                }
            }

            // Check for approved request for the current date to set the correct type for new timer
            const now = new Date()
            const nowUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
            
            const currentApprovedRequest = await tx.request.findFirst({
                where: {
                    userId: session.user.id,
                    status: "APPROVED",
                    affectsHourType: true,
                    cancelledAt: null,
                    startDate: { lte: nowUTC },
                    endDate: { gte: nowUTC },
                },
                orderBy: {
                    approvedAt: "desc",
                },
            })

            let newEntryType: "WORK" | "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "OTHER" = "WORK"
            if (currentApprovedRequest) {
                newEntryType = currentApprovedRequest.type
            }

            return await tx.taskTimeEntry.create({
                data: {
                    taskId,
                    userId: session.user.id,
                    startTime: new Date(),
                    type: newEntryType,
                },
            })
        })

        await refreshDailyHourSummary()
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
                cancelledAt: null,
            },
            orderBy: {
                approvedAt: "desc",
            },
        })

        let hourType: "WORK" | "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "OTHER" = "WORK"
        if (approvedRequest) {
            hourType = approvedRequest.type
        }

        await refreshDailyHourSummary()
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

async function getHourTypeForDate(
    userId: string,
    date: Date
): Promise<"WORK" | "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "OTHER"> {
    const dateUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

    const approvedRequest = await prisma.request.findFirst({
        where: {
            userId,
            status: "APPROVED",
            affectsHourType: true,
            startDate: { lte: dateUTC },
            endDate: { gte: dateUTC },
            cancelledAt: null,
        },
        orderBy: {
            approvedAt: "desc",
        },
    })

    return approvedRequest ? approvedRequest.type : "WORK"
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

        const oldDate = new Date(existing.startTime)
        oldDate.setHours(0, 0, 0, 0)

        const newDate = new Date(startTime)
        newDate.setHours(0, 0, 0, 0)

        const dateChanged = oldDate.getTime() !== newDate.getTime()

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

        await refreshDailyHourSummary()
        revalidatePath("/tasks")
        revalidatePath("/hours")
        revalidatePath("/time-sheets")

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

        await refreshDailyHourSummary()
        revalidatePath("/tasks")
        revalidatePath("/hours")
        revalidatePath("/time-sheets")

        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to delete time entry" }
    }
}
