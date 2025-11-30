"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import {
    CreateTaskSchema,
    UpdateTaskSchema,
    DeleteTaskSchema,
    ToggleExpandedSchema,
    type CreateTaskInput,
    type UpdateTaskInput,
    type DeleteTaskInput,
    type ToggleExpandedInput,
} from "../schemas/task-action-schemas"
import type { TaskDisplay } from "../schemas/task-schemas"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

export async function getTasks(): Promise<TaskDisplay[]> {
    try {
        const session = await requireAuth()

        const tasks = await prisma.task.findMany({
            where: { userId: session.user.id },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            include: {
                timeEntries: {
                    where: {
                        endTime: { not: null },
                    },
                    select: {
                        duration: true,
                    },
                },
            },
        })

        const taskMap = new Map(
            tasks.map((task) => {
                const directTime = task.timeEntries.reduce(
                    (sum, entry) => sum + (entry.duration ?? 0),
                    0
                )
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { timeEntries, ...taskData } = task
                return [
                    task.id,
                    {
                        ...taskData,
                        totalTime: directTime,
                        directTime,
                    },
                ]
            })
        )

        const calculateTotalTime = (taskId: string): number => {
            const task = taskMap.get(taskId)
            if (!task) return 0

            const subtasks = Array.from(taskMap.values()).filter((t) => t.parentId === taskId)
            const subtaskTime = subtasks.reduce(
                (sum, subtask) => sum + calculateTotalTime(subtask.id),
                0
            )

            const total = task.directTime + subtaskTime
            task.totalTime = total
            return total
        }

        tasks.forEach((task) => {
            if (!task.parentId) {
                calculateTotalTime(task.id)
            }
        })

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return Array.from(taskMap.values()).map(({ directTime, ...task }) => task)
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error("Failed to fetch tasks")
    }
}

export async function createTask(input: CreateTaskInput) {
    try {
        const session = await requireAuth()

        const validation = CreateTaskSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { title, description, status, parentId } = validation.data

        if (parentId) {
            const parentTask = await prisma.task.findUnique({
                where: { id: parentId },
            })

            if (!parentTask || parentTask.userId !== session.user.id) {
                return { error: "Parent task not found" }
            }
        }

        await prisma.task.create({
            data: {
                userId: session.user.id,
                title,
                description,
                status,
                parentId,
            },
        })

        revalidatePath("/tasks")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to create task" }
    }
}

export async function updateTask(input: UpdateTaskInput) {
    try {
        const session = await requireAuth()

        const validation = UpdateTaskSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { id, title, description, status, order } = validation.data

        const existing = await prisma.task.findUnique({
            where: { id },
        })

        if (!existing || existing.userId !== session.user.id) {
            return { error: "Task not found" }
        }

        await prisma.task.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(status !== undefined && { status }),
                ...(order !== undefined && { order }),
            },
        })

        revalidatePath("/tasks")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to update task" }
    }
}

export async function deleteTask(input: DeleteTaskInput) {
    try {
        const session = await requireAuth()

        const validation = DeleteTaskSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { id } = validation.data

        const existing = await prisma.task.findUnique({
            where: { id },
        })

        if (!existing || existing.userId !== session.user.id) {
            return { error: "Task not found" }
        }

        await prisma.task.delete({
            where: { id },
        })

        revalidatePath("/tasks")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to delete task" }
    }
}

export async function toggleTaskExpanded(input: ToggleExpandedInput) {
    try {
        const session = await requireAuth()

        const validation = ToggleExpandedSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { id, isExpanded } = validation.data

        const existing = await prisma.task.findUnique({
            where: { id },
        })

        if (!existing || existing.userId !== session.user.id) {
            return { error: "Task not found" }
        }

        await prisma.task.update({
            where: { id },
            data: { isExpanded },
        })

        revalidatePath("/tasks")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to toggle task expansion" }
    }
}
