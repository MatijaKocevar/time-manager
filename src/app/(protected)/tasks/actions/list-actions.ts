"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth"
import {
    CreateListSchema,
    UpdateListSchema,
    DeleteListSchema,
    MoveTaskToListSchema,
    type CreateListInput,
    type UpdateListInput,
    type DeleteListInput,
    type MoveTaskToListInput,
    type ListDisplay,
} from "../schemas/list-schemas"

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

export async function getLists(): Promise<ListDisplay[]> {
    try {
        const session = await requireAuth()

        const lists = await prisma.list.findMany({
            where: { userId: session.user.id },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        })

        return lists.map((list) => ({
            id: list.id,
            userId: list.userId,
            name: list.name,
            description: list.description,
            color: list.color,
            icon: list.icon,
            order: list.order,
            isDefault: list.isDefault,
            createdAt: list.createdAt,
            updatedAt: list.updatedAt,
            taskCount: list._count.tasks,
        }))
    } catch (error) {
        if (
            error instanceof Error &&
            (error.message.includes("Dynamic server usage") || error.message.includes("headers"))
        ) {
            throw error
        }
        console.error("Error fetching lists:", error)
        throw error
    }
}

export async function createList(input: CreateListInput) {
    try {
        const session = await requireAuth()

        const validation = CreateListSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const data = validation.data

        const existingList = await prisma.list.findUnique({
            where: {
                userId_name: {
                    userId: session.user.id,
                    name: data.name,
                },
            },
        })

        if (existingList) {
            return { error: "A list with this name already exists" }
        }

        const list = await prisma.list.create({
            data: {
                userId: session.user.id,
                name: data.name,
                description: data.description,
                color: data.color,
                icon: data.icon,
                order: data.order,
                isDefault: data.isDefault,
            },
        })

        revalidatePath("/tasks")
        return { success: true, list }
    } catch (error) {
        console.error("Error creating list:", error)
        return { error: "Failed to create list" }
    }
}

export async function updateList(input: UpdateListInput) {
    try {
        const session = await requireAuth()

        const validation = UpdateListSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { id, ...data } = validation.data

        const existingList = await prisma.list.findUnique({
            where: { id },
        })

        if (!existingList) {
            return { error: "List not found" }
        }

        if (existingList.userId !== session.user.id) {
            return { error: "Unauthorized" }
        }

        if (data.name) {
            const nameConflict = await prisma.list.findFirst({
                where: {
                    userId: session.user.id,
                    name: data.name,
                    id: { not: id },
                },
            })

            if (nameConflict) {
                return { error: "A list with this name already exists" }
            }
        }

        const list = await prisma.list.update({
            where: { id },
            data,
        })

        revalidatePath("/tasks")
        return { success: true, list }
    } catch (error) {
        console.error("Error updating list:", error)
        return { error: "Failed to update list" }
    }
}

export async function deleteList(input: DeleteListInput) {
    try {
        const session = await requireAuth()

        const validation = DeleteListSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { id } = validation.data

        const existingList = await prisma.list.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        })

        if (!existingList) {
            return { error: "List not found" }
        }

        if (existingList.userId !== session.user.id) {
            return { error: "Unauthorized" }
        }

        if (existingList.isDefault) {
            return { error: "Cannot delete the default list" }
        }

        if (existingList._count.tasks > 0) {
            const defaultList = await prisma.list.findFirst({
                where: {
                    userId: session.user.id,
                    isDefault: true,
                },
            })

            if (defaultList) {
                await prisma.task.updateMany({
                    where: {
                        listId: id,
                    },
                    data: {
                        listId: defaultList.id,
                    },
                })
            } else {
                await prisma.task.updateMany({
                    where: {
                        listId: id,
                    },
                    data: {
                        listId: null,
                    },
                })
            }
        }

        await prisma.list.delete({
            where: { id },
        })

        revalidatePath("/tasks")
        return { success: true }
    } catch (error) {
        console.error("Error deleting list:", error)
        return { error: "Failed to delete list" }
    }
}

async function getAllDescendantIds(taskId: string): Promise<string[]> {
    const descendants: string[] = []
    const children = await prisma.task.findMany({
        where: { parentId: taskId },
        select: { id: true },
    })

    for (const child of children) {
        descendants.push(child.id)
        const childDescendants = await getAllDescendantIds(child.id)
        descendants.push(...childDescendants)
    }

    return descendants
}

export async function moveTaskToList(input: MoveTaskToListInput) {
    try {
        const session = await requireAuth()

        const validation = MoveTaskToListSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { taskId, listId } = validation.data

        const task = await prisma.task.findUnique({
            where: { id: taskId },
        })

        if (!task) {
            return { error: "Task not found" }
        }

        if (task.userId !== session.user.id) {
            return { error: "Unauthorized" }
        }

        if (listId) {
            const list = await prisma.list.findUnique({
                where: { id: listId },
            })

            if (!list) {
                return { error: "List not found" }
            }

            if (list.userId !== session.user.id) {
                return { error: "Unauthorized" }
            }
        }

        const descendantIds = await getAllDescendantIds(taskId)
        const allTaskIds = [taskId, ...descendantIds]

        await prisma.task.updateMany({
            where: { id: { in: allTaskIds } },
            data: { listId },
        })

        revalidatePath("/tasks")
        return { success: true }
    } catch (error) {
        console.error("Error moving task to list:", error)
        return { error: "Failed to move task" }
    }
}
