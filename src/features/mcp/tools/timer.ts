import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import {
    getActiveTimer,
    startTimer,
    stopTimer,
} from "@/app/(protected)/shared/_actions/timer-actions"
import { errorResult, jsonResult, runTool } from "../lib/tool-helpers"

const hourTypeSchema = z.enum([
    "WORK",
    "WORK_FROM_HOME",
    "BREAK",
    "PRIVATE",
    "VACATION",
    "SICK_LEAVE",
])

export function registerTimerTools(server: McpServer) {
    server.registerTool(
        "get_active_timer",
        {
            title: "Get active timer",
            description:
                "Get the currently running timer, including its entry id, task and start time, or null when no timer is running.",
        },
        async (ctx) => runTool(ctx, async () => jsonResult(await getActiveTimer()))
    )

    server.registerTool(
        "start_timer",
        {
            title: "Start timer",
            description:
                "Start tracking time. Pass taskId to track a specific task, or type to track a category without a task. " +
                "Starting a timer automatically stops any timer that is already running. " +
                "Type defaults to WORK; BREAK and PRIVATE must not be combined with taskId.",
            inputSchema: z.object({
                taskId: z.string().optional().describe("Task id to track"),
                type: hourTypeSchema
                    .optional()
                    .describe("Hour type when no task is given (default WORK)"),
            }),
        },
        async ({ taskId, type }, ctx) =>
            runTool(ctx, async () => {
                const result = await startTimer({ taskId, type })

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )

    server.registerTool(
        "stop_timer",
        {
            title: "Stop timer",
            description:
                "Stop a running timer. When entryId is omitted, the current active timer is stopped.",
            inputSchema: z.object({
                entryId: z
                    .string()
                    .optional()
                    .describe("Time entry id. Defaults to the active timer."),
            }),
        },
        async ({ entryId }, ctx) =>
            runTool(ctx, async () => {
                let id = entryId

                if (!id) {
                    const activeTimer = await getActiveTimer()

                    if (!activeTimer) {
                        return errorResult("No active timer")
                    }

                    id = activeTimer.id
                }

                const result = await stopTimer({ id })

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )
}
