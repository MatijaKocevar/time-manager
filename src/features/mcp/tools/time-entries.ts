import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import {
    createTaskTimeEntry,
    deleteTaskTimeEntry,
    updateTaskTimeEntry,
} from "@/app/(protected)/tasks/_actions/task-time-actions"
import {
    getTimeSheetEntries,
    moveTimeEntryToTask,
} from "@/app/(protected)/time-sheets/_actions/time-sheet-actions"
import { prisma } from "@/lib/prisma"
import { errorResult, jsonResult, runTool } from "../lib/tool-helpers"

const isoDateTimeSchema = z
    .string()
    .datetime({ offset: true })
    .describe("ISO 8601 timestamp with timezone offset, e.g. 2026-10-10T09:00:00+02:00")

const dateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe("Date in YYYY-MM-DD format")

const hourTypeSchema = z.enum([
    "WORK",
    "WORK_FROM_HOME",
    "BREAK",
    "PRIVATE",
    "VACATION",
    "SICK_LEAVE",
])

export function registerTimeEntryTools(server: McpServer) {
    server.registerTool(
        "list_time_entries",
        {
            title: "List time entries",
            description:
                "List the authenticated user's time entries for a date range (inclusive), with the entry ids needed by " +
                "update_time_entry, delete_time_entry and move_time_entry. Optionally filter by taskId or hour type. " +
                "Dates use YYYY-MM-DD and UTC day boundaries, like get_timesheet.",
            inputSchema: z.object({
                startDate: dateSchema.describe("Start date (YYYY-MM-DD)"),
                endDate: dateSchema.describe("End date (YYYY-MM-DD)"),
                taskId: z.string().optional().describe("Only entries of this task"),
                type: hourTypeSchema.optional().describe("Only entries of this hour type"),
            }),
        },
        async ({ startDate, endDate, taskId, type }, ctx) =>
            runTool(ctx, async () => {
                const range = {
                    startDate: `${startDate}T00:00:00.000Z`,
                    endDate: `${endDate}T00:00:00.000Z`,
                    fresh: true,
                }

                const [workResult, privateResult] = await Promise.all([
                    getTimeSheetEntries({ ...range, taskFilter: "work" }),
                    getTimeSheetEntries({ ...range, taskFilter: "private" }),
                ])

                if (workResult.error !== undefined) {
                    return errorResult(workResult.error)
                }

                if (privateResult.error !== undefined) {
                    return errorResult(privateResult.error)
                }

                const entries = [...workResult.data, ...privateResult.data]
                    .filter((entry) => !taskId || entry.taskId === taskId)
                    .filter((entry) => !type || entry.type === type)
                    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

                return jsonResult(
                    entries.map((entry) => ({
                        id: entry.id,
                        taskId: entry.taskId,
                        taskTitle: entry.task.title,
                        startTime: entry.startTime,
                        endTime: entry.endTime,
                        durationSeconds: entry.duration,
                        type: entry.type,
                        isActive: entry.endTime === null,
                    }))
                )
            })
    )

    server.registerTool(
        "create_time_entry",
        {
            title: "Create time entry",
            description:
                "Add a completed time entry to a task (start and end time in the past). To start an open timer instead, " +
                "use start_timer. Timestamps must be ISO 8601 with a timezone offset.",
            inputSchema: z.object({
                taskId: z.string().describe("Task id to track"),
                startTime: isoDateTimeSchema.describe("Entry start"),
                endTime: isoDateTimeSchema.describe("Entry end"),
            }),
        },
        async ({ taskId, startTime, endTime }, ctx) =>
            runTool(ctx, async () => {
                const result = await createTaskTimeEntry({
                    taskId,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                })

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )

    server.registerTool(
        "update_time_entry",
        {
            title: "Update time entry",
            description:
                "Update a time entry's start and/or end time. Setting endTime on a running entry stops it at that time, " +
                "which fixes a timer that was left running. Times must be in the past and start must be before end. " +
                "An ended entry cannot be reopened. Timestamps must be ISO 8601 with a timezone offset.",
            inputSchema: z.object({
                id: z.string().describe("Time entry id"),
                startTime: isoDateTimeSchema.optional().describe("New start time"),
                endTime: isoDateTimeSchema
                    .optional()
                    .describe("New end time; omit to keep the current one"),
            }),
        },
        async ({ id, startTime, endTime }, ctx) =>
            runTool(ctx, async (identity) => {
                if (startTime === undefined && endTime === undefined) {
                    return errorResult("Provide startTime and/or endTime")
                }

                const existing = await prisma.taskTimeEntry.findUnique({
                    where: { id },
                    select: { userId: true, startTime: true, endTime: true },
                })

                if (!existing || existing.userId !== identity.userId) {
                    return errorResult(`Time entry not found: ${id}`)
                }

                const result = await updateTaskTimeEntry({
                    id,
                    startTime: startTime ? new Date(startTime) : existing.startTime,
                    endTime:
                        endTime !== undefined ? new Date(endTime) : (existing.endTime ?? undefined),
                })

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )

    server.registerTool(
        "delete_time_entry",
        {
            title: "Delete time entry",
            description:
                "Permanently delete a time entry. To only end the running timer, use stop_timer or update_time_entry.",
            inputSchema: z.object({
                id: z.string().describe("Time entry id"),
            }),
        },
        async ({ id }, ctx) =>
            runTool(ctx, async () => {
                const result = await deleteTaskTimeEntry({ id })

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )

    server.registerTool(
        "move_time_entry",
        {
            title: "Move time entry",
            description: "Switch a time entry to a different task.",
            inputSchema: z.object({
                entryId: z.string().describe("Time entry id to move"),
                targetTaskId: z.string().describe("Task id to move the entry to"),
            }),
        },
        async ({ entryId, targetTaskId }, ctx) =>
            runTool(ctx, async () => {
                const result = await moveTimeEntryToTask({ entryId, targetTaskId })

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )
}
