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
import type { TaskDisplay, TasksFilter } from "../schemas/task-schemas"
import { TASK_STATUS } from "../constants/task-statuses"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

export async function getTasks(filters?: TasksFilter): Promise<TaskDisplay[]> {
    try {
        const session = await requireAuth()

        type WhereClause = {
            userId: string
            listId?: string | null
            status?: (typeof TASK_STATUS)[keyof typeof TASK_STATUS]
        }

        const whereClause: WhereClause = {
            userId: session.user.id,
        }

        if (filters?.listId !== undefined) {
            whereClause.listId = filters.listId
        }

        if (filters?.status) {
            whereClause.status = filters.status
        }

        const [tasks, timeAggregates] = await Promise.all([
            prisma.task.findMany({
                where: whereClause,
                orderBy: [{ order: "asc" }, { createdAt: "asc" }],
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
                    createdAt: true,
                    updatedAt: true,
                    list: {
                        select: {
                            name: true,
                            color: true,
                            icon: true,
                        },
                    },
                },
            }),
            prisma.taskTimeEntry.groupBy({
                by: ["taskId"],
                where: {
                    userId: session.user.id,
                    endTime: { not: null },
                    task: whereClause,
                },
                _sum: {
                    duration: true,
                },
            }),
        ])

        const timeMap = new Map(timeAggregates.map((agg) => [agg.taskId, agg._sum.duration ?? 0]))

        type TaskWithTime = Omit<(typeof tasks)[number], "list"> & {
            listName: string | null
            listColor: string | null
            listIcon: string | null
            totalTime: number
            directTime: number
        }

        const taskMap = new Map<string, TaskWithTime>(
            tasks.map((task) => {
                const directTime = timeMap.get(task.id) ?? 0
                const { list, ...taskData } = task
                return [
                    task.id,
                    {
                        ...taskData,
                        listName: list?.name ?? null,
                        listColor: list?.color ?? null,
                        listIcon: list?.icon ?? null,
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
                (sum: number, subtask) => sum + calculateTotalTime(subtask.id),
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

        return Array.from(taskMap.values()).map(({ directTime, ...task }) => {
            void directTime
            return task
        })
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

        const { title, description, status, parentId, listId } = validation.data

        let finalListId = listId

        if (parentId) {
            const parentTask = await prisma.task.findUnique({
                where: { id: parentId },
            })

            if (!parentTask || parentTask.userId !== session.user.id) {
                return { error: "Parent task not found" }
            }

            if (finalListId === undefined) {
                finalListId = parentTask.listId
            }
        }

        if (finalListId) {
            const list = await prisma.list.findUnique({
                where: { id: finalListId },
            })

            if (!list || list.userId !== session.user.id) {
                return { error: "List not found" }
            }
        }

        await prisma.task.create({
            data: {
                userId: session.user.id,
                title,
                description,
                status,
                parentId,
                listId: finalListId,
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
export type TasksByList = {
    listId: string | null
    listName: string
    listColor: string | null
    listIcon: string | null
    tasks: TaskDisplay[]
}

export async function getInProgressTasksByLists(): Promise<TasksByList[]> {
    try {
        const session = await requireAuth()

        const whereClause = {
            userId: session.user.id,
            status: {
                in: [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS],
            },
        }

        const [tasks, timeAggregates] = await Promise.all([
            prisma.task.findMany({
                where: whereClause,
                orderBy: [{ order: "asc" }, { createdAt: "asc" }],
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
                    createdAt: true,
                    updatedAt: true,
                    list: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                            icon: true,
                            order: true,
                        },
                    },
                },
            }),
            prisma.taskTimeEntry.groupBy({
                by: ["taskId"],
                where: {
                    userId: session.user.id,
                    endTime: { not: null },
                    task: whereClause,
                },
                _sum: {
                    duration: true,
                },
            }),
        ])

        const timeMap = new Map(timeAggregates.map((agg) => [agg.taskId, agg._sum.duration ?? 0]))

        const taskMap = new Map(
            tasks.map((task) => {
                const directTime = timeMap.get(task.id) ?? 0
                const { list, ...taskData } = task
                return [
                    task.id,
                    {
                        ...taskData,
                        totalTime: directTime,
                        directTime,
                        listId: task.listId,
                        list,
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

        const groupedByList = new Map<string | null, TasksByList>()

        Array.from(taskMap.values()).forEach((task) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { directTime, list, ...taskData } = task
            const listId = task.listId

            if (!groupedByList.has(listId)) {
                groupedByList.set(listId, {
                    listId,
                    listName: list?.name ?? "No List",
                    listColor: list?.color ?? null,
                    listIcon: list?.icon ?? null,
                    tasks: [],
                })
            }

            groupedByList.get(listId)!.tasks.push(taskData)
        })

        const result = Array.from(groupedByList.values())
        result.sort((a, b) => {
            if (a.listId === null) return 1
            if (b.listId === null) return -1
            return a.listName.localeCompare(b.listName)
        })

        return result
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error("Failed to fetch in-progress tasks by lists")
    }
}

export async function getRecentTasks(): Promise<TaskDisplay[]> {
    try {
        const session = await requireAuth()

        const recentTasks = await prisma.task.findMany({
            where: {
                userId: session.user.id,
                status: {
                    in: [TASK_STATUS.IN_PROGRESS, TASK_STATUS.TODO],
                },
            },
            include: {
                list: true,
                timeEntries: {
                    where: {
                        userId: session.user.id,
                    },
                    orderBy: {
                        startTime: "desc",
                    },
                    take: 1,
                },
            },
            orderBy: [
                {
                    updatedAt: "desc",
                },
            ],
            take: 20,
        })

        const tasksWithTime = recentTasks.filter((task) => task.timeEntries.length > 0)
        const tasksWithoutTime = recentTasks.filter((task) => task.timeEntries.length === 0)

        const sortedTasks = [...tasksWithTime, ...tasksWithoutTime].slice(0, 10)

        const tasks: TaskDisplay[] = sortedTasks.map((task) => ({
            id: task.id,
            userId: task.userId,
            listId: task.listId,
            listName: task.list?.name ?? null,
            listColor: task.list?.color ?? null,
            listIcon: task.list?.icon ?? null,
            title: task.title,
            description: task.description,
            status: task.status,
            parentId: task.parentId,
            order: task.order,
            isExpanded: task.isExpanded,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
        }))

        return tasks
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error("Failed to fetch recent tasks")
    }
}
