import { refreshDailyHourSummary } from "@/lib/materialized-views"
import { revalidatePath } from "next/cache"
import { sseManager } from "@/lib/sse-manager"
import { getPusherServer } from "@/lib/pusher-server"
import type { HourType, Prisma } from "@/../../prisma/generated/client"

export interface TimerBroadcastData {
    entryId: string
    taskId?: string
    startTime?: Date
    type?: HourType
    duration?: number | null
}

export async function broadcastTimerEvent(
    userId: string,
    event: "timer-started" | "timer-stopped" | "time-entry-updated",
    data: TimerBroadcastData
) {
    sseManager.broadcast(userId, event, data)

    if (process.env.VERCEL) {
        const pusher = getPusherServer()
        if (pusher) {
            await pusher.trigger(`private-user-${userId}`, event, data)
        }
    }
}

export async function findActiveTimer(tx: Prisma.TransactionClient, userId: string) {
    return await tx.taskTimeEntry.findFirst({
        where: {
            userId,
            endTime: null,
        },
    })
}

export async function stopActiveTimer(tx: Prisma.TransactionClient, userId: string) {
    const existingActiveTimer = await findActiveTimer(tx, userId)

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
}

export async function determineHourType(
    tx: Prisma.TransactionClient,
    userId: string,
    baseType: HourType,
    isBreak: boolean,
    isPrivate: boolean
): Promise<HourType> {
    if (isBreak) {
        return "BREAK"
    }

    if (isPrivate) {
        return "PRIVATE"
    }

    if (baseType === "WORK") {
        const now = new Date()

        const approvedRequests = await tx.request.findMany({
            where: {
                userId,
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
                return request.type
            }
        }
    }

    return baseType
}

export async function revalidateTimerPaths() {
    revalidatePath("/tracker")
    revalidatePath("/tasks")
    revalidatePath("/hours")
    revalidatePath("/time-sheets")
}

export async function refreshTimerData() {
    await refreshDailyHourSummary()
    await revalidateTimerPaths()
}
