type SSEConnection = {
    userId: string
    controller: ReadableStreamDefaultController
}

class SSEManager {
    private connections: Map<string, Map<number, ReadableStreamDefaultController>> = new Map()
    private nextId = 0

    addConnection(userId: string, controller: ReadableStreamDefaultController) {
        if (!this.connections.has(userId)) {
            this.connections.set(userId, new Map())
        }
        const id = this.nextId++
        this.connections.get(userId)!.set(id, controller)
        console.log(
            `[SSE Manager] Added connection ${id} for user ${userId}, total: ${this.getConnectionCount(userId)}`
        )
        console.log(
            `[SSE Manager] All users with connections:`,
            Array.from(this.connections.keys())
        )
        return id
    }

    removeConnection(userId: string, connectionId: number) {
        const userConnections = this.connections.get(userId)
        if (userConnections) {
            userConnections.delete(connectionId)
            console.log(`[SSE Manager] Removed connection ${connectionId} for user ${userId}`)
            if (userConnections.size === 0) {
                this.connections.delete(userId)
            }
        }
    }

    broadcast(userId: string, event: string, data: unknown) {
        const userConnections = this.connections.get(userId)
        console.log(
            `[SSE Manager] Broadcasting ${event} to user ${userId}, connections: ${userConnections?.size ?? 0}`
        )

        if (!userConnections || userConnections.size === 0) {
            console.log(`[SSE Manager] No connections for user ${userId}`)
            return
        }

        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        const encoder = new TextEncoder()
        const encoded = encoder.encode(message)

        const failedConnectionIds: number[] = []

        userConnections.forEach((controller, id) => {
            try {
                controller.enqueue(encoded)
                console.log(`[SSE Manager] Sent ${event} event to connection ${id}`)
            } catch (error) {
                console.error(`[SSE Manager] Failed to send to connection ${id}:`, error)
                failedConnectionIds.push(id)
            }
        })

        failedConnectionIds.forEach((id) => {
            console.log(`[SSE Manager] Removing failed connection ${id}`)
            this.removeConnection(userId, id)
        })
    }

    getConnectionCount(userId: string): number {
        return this.connections.get(userId)?.size ?? 0
    }
}

// Use global to persist singleton across hot reloads
const globalForSSE = globalThis as unknown as {
    sseManager: SSEManager | undefined
}

export const sseManager = globalForSSE.sseManager ?? new SSEManager()

if (process.env.NODE_ENV !== "production") {
    globalForSSE.sseManager = sseManager
}
