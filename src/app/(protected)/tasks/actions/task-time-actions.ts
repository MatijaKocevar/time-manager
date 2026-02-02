"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import type { HourType } from "@/../../prisma/generated/client"
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
import { getPusherServer } from "@/lib/pusher-server"
import { sseManager } from "@/lib/sse-manager"

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
            }

            // Determine type - BREAK and PRIVATE system tasks ALWAYS use their type
            let newEntryType: HourType = "WORK"

            // Check if this is a BREAK or PRIVATE system task (these override requests)
            if (task.isSystemTask && task.title) {
                if (task.title === "System: BREAK") {
                    newEntryType = "BREAK"
                } else if (task.title === "System: PRIVATE") {
                    newEntryType = "PRIVATE"
                }
            }

            // If not BREAK/PRIVATE, check for approved requests (applies to General Work and all regular tasks)
            if (newEntryType === "WORK") {
                // Check for approved request for the current date/time to set the correct type for new timer
                // BUT: NEVER use VACATION or SICK_LEAVE for manually tracked time
                // Those types are ONLY for automatic entries created by request approval
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
                        newEntryType = request.type
                        break
                    }
                }
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
        revalidatePath("/tracker")
        revalidatePath("/hours")
        revalidatePath("/time-sheets")

        const broadcastData = {
            entryId: newEntry.id,
            taskId,
            startTime: newEntry.startTime,
            type: newEntry.type,
        }

        sseManager.broadcast(session.user.id, "timer-started", broadcastData)

        if (process.env.VERCEL) {
            const pusher = getPusherServer()
            if (pusher) {
                pusher.trigger(`private-user-${session.user.id}`, "timer-started", broadcastData)
            }
        }

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

        await refreshDailyHourSummary()
        revalidatePath("/tasks")
        revalidatePath("/tracker")
        revalidatePath("/hours")
        revalidatePath("/time-sheets")

        const broadcastData = {
            entryId: id,
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
        return { error: "Failed to stop timer" }
    }
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
        revalidatePath("/tracker")
        revalidatePath("/hours")
        revalidatePath("/time-sheets")

        const broadcastData = {
            entryId: id,
            startTime,
            endTime,
            duration,
        }

        sseManager.broadcast(session.user.id, "time-entry-updated", broadcastData)

        if (process.env.VERCEL) {
            const pusher = getPusherServer()
            if (pusher) {
                pusher.trigger(
                    `private-user-${session.user.id}`,
                    "time-entry-updated",
                    broadcastData
                )
            }
        }

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
        revalidatePath("/tracker")
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
