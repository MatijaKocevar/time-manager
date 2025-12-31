import { PrismaClient, TaskStatus } from "../generated/client"
import { SeededRandom, TASK_TEMPLATES, addDays } from "./utils"

export async function seedTasksForUser(
    prisma: PrismaClient,
    random: SeededRandom,
    userId: string,
    lists: Array<{ id: string; name: string }>
) {
    const taskCount = random.nextInt(30, 50)
    const tasks = []

    const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "ON_HOLD", "CANCELED"]
    const statusWeights = [25, 35, 30, 7, 3]

    for (let i = 0; i < taskCount; i++) {
        const rand = random.nextInt(0, 99)
        let status: TaskStatus = "TODO"
        let cumulative = 0
        for (let j = 0; j < statusWeights.length; j++) {
            cumulative += statusWeights[j]
            if (rand < cumulative) {
                status = statuses[j]
                break
            }
        }

        tasks.push({
            userId,
            listId: random.choice(lists).id,
            title: `${random.choice(TASK_TEMPLATES)} #${i + 1}`,
            description: random.next() > 0.5 ? "Detailed task description" : null,
            status,
            order: i,
            isExpanded: false,
        })
    }

    await prisma.task.createMany({ data: tasks })

    const allTasks = await prisma.task.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: taskCount,
    })

    const subtasks = []
    for (const task of allTasks) {
        if (random.next() < 0.3) {
            const subtaskCount = random.nextInt(1, 3)
            for (let j = 0; j < subtaskCount; j++) {
                subtasks.push({
                    userId,
                    listId: task.listId,
                    title: `Subtask: ${task.title} (${j + 1})`,
                    status: task.status,
                    parentId: task.id,
                    order: j,
                })
            }
        }
    }

    if (subtasks.length > 0) {
        await prisma.task.createMany({ data: subtasks })
    }

    return allTasks
}

export async function seedTimeEntriesForUser(
    prisma: PrismaClient,
    random: SeededRandom,
    userId: string,
    tasks: Array<{ id: string }>,
    startDate: Date,
    endDate: Date
) {
    const entries = []
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const entryCount = Math.floor(daysDiff * 2.5)

    for (let i = 0; i < entryCount; i++) {
        const task = random.choice(tasks)
        const daysAgo = random.nextInt(0, daysDiff)
        const startTime = addDays(endDate, -daysAgo)
        startTime.setUTCHours(random.nextInt(8, 16), random.nextInt(0, 59), 0, 0)

        const isCompleted = i > 0 || random.next() > 0.05
        const durationSeconds = isCompleted ? random.nextInt(900, 7200) : null
        const endTime = isCompleted ? new Date(startTime.getTime() + durationSeconds! * 1000) : null

        entries.push({
            taskId: task.id,
            userId,
            startTime,
            endTime,
            duration: durationSeconds,
        })
    }

    let hasActive = false
    const finalEntries = entries.map((entry) => {
        if (!entry.endTime && !hasActive) {
            hasActive = true
            return entry
        } else if (!entry.endTime) {
            const duration = random.nextInt(1800, 14400)
            return {
                ...entry,
                endTime: new Date(entry.startTime.getTime() + duration * 1000),
                duration,
            }
        }
        return entry
    })

    await prisma.taskTimeEntry.createMany({ data: finalEntries })

    return finalEntries.length
}
