import type { McpServer } from "@modelcontextprotocol/server"
import { registerTaskTools } from "./tools/tasks"
import { registerTimerTools } from "./tools/timer"
import { registerTimeEntryTools } from "./tools/time-entries"
import { registerRequestTools } from "./tools/requests"
import { registerUrnikTools } from "./tools/urnik"
import { registerReportTools } from "./tools/reports"

export function registerTools(server: McpServer) {
    registerTaskTools(server)
    registerTimerTools(server)
    registerTimeEntryTools(server)
    registerRequestTools(server)
    registerUrnikTools(server)
    registerReportTools(server)
}
