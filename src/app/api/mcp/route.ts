import { createMcpHandler, withMcpAuth } from "mcp-handler"
import { registerTools, verifyApiToken } from "@/features/mcp"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const handler = createMcpHandler(registerTools, {
    serverInfo: {
        name: "time-manager",
        version: "1.0.0",
    },
    instructions:
        "Time Manager tools for tasks, time tracking and hour reports. " +
        "Timestamps are ISO 8601 and durations are in seconds. " +
        "Use list_task_lists to discover list ids and list_tasks to discover task ids.",
})

const authHandler = withMcpAuth(handler, verifyApiToken, { required: true })

export { authHandler as GET, authHandler as POST }
