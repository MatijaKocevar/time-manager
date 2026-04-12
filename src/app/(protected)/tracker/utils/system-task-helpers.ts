import type { HourType } from "@/../../prisma/generated/client"
import type { PrismaClient } from "@/../../prisma/generated/client"

export type SystemTaskType = "BREAK" | "PRIVATE" | "GENERAL_WORK"

export function getSystemTaskTitle(type: SystemTaskType): string {
    if (type === "GENERAL_WORK") {
        return "System: General Work"
    }
    return `System: ${type}`
}

export function getSystemTaskTitleForHourType(hourType: HourType): string {
    switch (hourType) {
        case "WORK":
            return "System: General Work"
        case "VACATION":
            return "System: VACATION"
        case "SICK_LEAVE":
            return "System: SICK_LEAVE"
        case "WORK_FROM_HOME":
            return "System: WORK_FROM_HOME"
        case "BREAK":
            return "System: BREAK"
        case "PRIVATE":
            return "System: PRIVATE"
    }
}

export async function getOrCreateSystemTaskForHourType(
    tx: Omit<
        PrismaClient,
        "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >,
    userId: string,
    hourType: HourType
) {
    const title = getSystemTaskTitleForHourType(hourType)

    let systemTask = await tx.task.findFirst({
        where: {
            userId,
            title,
            isSystemTask: true,
        },
    })

    if (!systemTask) {
        systemTask = await tx.task.create({
            data: {
                userId,
                title,
                description: `Automatically created for ${hourType.toLowerCase()} tracking`,
                status: "DONE",
                isSystemTask: true,
            },
        })
    }

    return systemTask
}

export function isBreakOrPrivate(type: HourType): boolean {
    return type === "BREAK" || type === "PRIVATE"
}

export function shouldUseSystemTask(type: HourType, hasTaskId: boolean): boolean {
    return type === "BREAK" || type === "PRIVATE" || (type === "WORK" && !hasTaskId)
}

export async function getOrCreateSystemTask(
    tx: Omit<
        PrismaClient,
        "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >,
    userId: string,
    type: SystemTaskType
) {
    const title = getSystemTaskTitle(type)

    let systemTask = await tx.task.findFirst({
        where: {
            userId,
            title,
            isSystemTask: true,
        },
    })

    if (!systemTask) {
        systemTask = await tx.task.create({
            data: {
                userId,
                title,
                description: `Automatically created for ${type.toLowerCase()} tracking`,
                status: "DONE",
                isSystemTask: true,
            },
        })
    }

    return systemTask
}

export async function getSystemTask(
    tx: Omit<
        PrismaClient,
        "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >,
    userId: string,
    type: SystemTaskType
) {
    const title = getSystemTaskTitle(type)

    return await tx.task.findFirst({
        where: {
            userId,
            title,
            isSystemTask: true,
        },
    })
}
