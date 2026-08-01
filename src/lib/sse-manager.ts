class SSEManager {
    private connections: Map<string, Map<number, ReadableStreamDefaultController>> = new Map()
    private nextId = 0

    addConnection(userId: string, controller: ReadableStreamDefaultController) {
        if (!this.connections.has(userId)) {
            this.connections.set(userId, new Map())
        }
        const id = this.nextId++
        this.connections.get(userId)!.set(id, controller)
        return id
    }

    removeConnection(userId: string, connectionId: number) {
        const userConnections = this.connections.get(userId)
        if (userConnections) {
            userConnections.delete(connectionId)
            if (userConnections.size === 0) {
                this.connections.delete(userId)
            }
        }
    }

    broadcast(userId: string, event: string, data: unknown) {
        const userConnections = this.connections.get(userId)

        if (!userConnections || userConnections.size === 0) {
            return
        }

        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        const encoder = new TextEncoder()
        const encoded = encoder.encode(message)

        const failedConnectionIds: number[] = []

        userConnections.forEach((controller, id) => {
            try {
                controller.enqueue(encoded)
            } catch (error) {
                console.error(`[SSE Manager] Failed to send to connection ${id}:`, error)
                failedConnectionIds.push(id)
            }
        })

        failedConnectionIds.forEach((id) => {
            this.removeConnection(userId, id)
        })
    }

    getConnectionCount(userId: string): number {
        return this.connections.get(userId)?.size ?? 0
    }
}

const globalForSSE = globalThis as unknown as {
    sseManager: SSEManager | undefined
}

if (!globalForSSE.sseManager) {
    globalForSSE.sseManager = new SSEManager()
}

export const sseManager = globalForSSE.sseManager
