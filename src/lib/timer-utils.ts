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
    const timestamp = new Date().toISOString()
    console.log(`[Timer Broadcast ${timestamp}] Broadcasting ${event} for user ${userId}`)
    console.log(`[Timer Broadcast ${timestamp}] Data:`, JSON.stringify(data))

    sseManager.broadcast(userId, event, data)
    console.log(`[Timer Broadcast ${timestamp}] SSE broadcast completed for ${event}`)

    if (process.env.VERCEL) {
        console.log(`[Timer Broadcast ${timestamp}] Vercel environment detected, using Pusher`)
        const pusher = getPusherServer()
        if (pusher) {
            await pusher.trigger(`private-user-${userId}`, event, data)
            console.log(`[Timer Broadcast ${timestamp}] Pusher broadcast completed for ${event}`)
        } else {
            console.warn(`[Timer Broadcast ${timestamp}] Pusher not available`)
        }
    } else {
        console.log(`[Timer Broadcast ${timestamp}] Non-Vercel environment, SSE only`)
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

        console.log(
            `[Timer Utils] Stopped existing timer ${existingActiveTimer.id}, duration: ${duration}s`
        )
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
        console.log("[Timer Utils] Task is BREAK type, using BREAK")
        return "BREAK"
    }

    if (isPrivate) {
        console.log("[Timer Utils] Task is PRIVATE type, using PRIVATE")
        return "PRIVATE"
    }

    if (baseType === "WORK") {
        const now = new Date()
        console.log("[Timer Utils] Checking for approved requests affecting hour type")

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
                console.log(
                    `[Timer Utils] Found active request with type ${request.type}, overriding to ${request.type}`
                )
                return request.type
            }
        }

        console.log("[Timer Utils] No active requests, using base type WORK")
    }

    return baseType
}

export async function revalidateTimerPaths() {
    console.log("[Timer Utils] Revalidating all timer-related paths")
    revalidatePath("/tracker")
    revalidatePath("/tasks")
    revalidatePath("/hours")
    revalidatePath("/time-sheets")
}

export async function refreshTimerData() {
    console.log("[Timer Utils] Refreshing daily hour summary")
    await refreshDailyHourSummary()
    await revalidateTimerPaths()
}
