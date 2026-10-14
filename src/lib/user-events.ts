import { sseManager } from "@/lib/sse-manager"
import { getPusherServer } from "@/lib/pusher-server"

export type UserEventName =
    | "timer-started"
    | "timer-stopped"
    | "time-entry-updated"
    | "task-updated"
    | "list-updated"

export interface TaskBroadcastData {
    taskId: string
    action: "created" | "updated" | "deleted"
}

export interface ListBroadcastData {
    listId: string
    action: "created" | "updated" | "deleted"
}

export async function broadcastUserEvent(userId: string, event: UserEventName, data: unknown) {
    sseManager.broadcast(userId, event, data)

    if (process.env.VERCEL) {
        const pusher = getPusherServer()
        if (pusher) {
            await pusher.trigger(`private-user-${userId}`, event, data)
        }
    }
}
