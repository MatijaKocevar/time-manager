import type { McpServer } from "@modelcontextprotocol/server"
import { registerTaskTools } from "./tools/tasks"
import { registerTimerTools } from "./tools/timer"
import { registerReportTools } from "./tools/reports"

export function registerTools(server: McpServer) {
    registerTaskTools(server)
    registerTimerTools(server)
    registerReportTools(server)
}
