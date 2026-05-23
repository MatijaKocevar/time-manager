"use server"

import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function getTaskDescription(taskId: string): Promise<{ description: string | null }> {
    const session = await requireAuth()

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { userId: true, description: true },
    })

    if (!task || task.userId !== session.user.id) {
        throw new Error("Task not found")
    }

    return { description: task.description }
}
