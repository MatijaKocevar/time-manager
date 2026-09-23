import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import { fetchMonthlyHourData } from "@/app/(protected)/hours/_actions/export-actions"
import { getTimeSheetEntries } from "@/app/(protected)/time-sheets/_actions/time-sheet-actions"
import { getTodayTimeSummary } from "@/app/(protected)/tracker/_actions/tracker-actions"
import { errorResult, jsonResult, runTool } from "../lib/tool-helpers"

const dateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe("Date in YYYY-MM-DD format")

export function registerReportTools(server: McpServer) {
    server.registerTool(
        "get_monthly_hours",
        {
            title: "Get monthly hours",
            description:
                "Get aggregated hours for a month: per-day hours by type (work, work from home, vacation, sick leave, break, private), " +
                "working days, expected hours, overtime and office/remote day counts.",
            inputSchema: z.object({
                month: z
                    .string()
                    .regex(/^\d{4}-\d{2}$/)
                    .describe("Month in YYYY-MM format"),
            }),
        },
        async ({ month }, ctx) =>
            runTool(ctx, async (identity) => {
                const data = await fetchMonthlyHourData(identity.userId, month)

                return jsonResult(data)
            })
    )

    server.registerTool(
        "get_timesheet",
        {
            title: "Get timesheet",
            description:
                "Get tracked time entries between two dates (inclusive), with task, list, start, end, duration in seconds and hour type. " +
                "taskFilter selects work entries (default) or private/break entries.",
            inputSchema: z.object({
                startDate: dateSchema.describe("Start date (YYYY-MM-DD)"),
                endDate: dateSchema.describe("End date (YYYY-MM-DD)"),
                taskFilter: z
                    .enum(["work", "private"])
                    .optional()
                    .describe("Which entries to return (default work)"),
            }),
        },
        async ({ startDate, endDate, taskFilter }, ctx) =>
            runTool(ctx, async () => {
                const result = await getTimeSheetEntries({
                    startDate: `${startDate}T00:00:00.000Z`,
                    endDate: `${endDate}T00:00:00.000Z`,
                    taskFilter: taskFilter ?? "work",
                    fresh: true,
                })

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )

    server.registerTool(
        "get_today_summary",
        {
            title: "Get today's summary",
            description:
                "Get today's worked hours grouped by WORK, BREAK and PRIVATE, plus the currently active timer if any.",
        },
        async (ctx) => runTool(ctx, async () => jsonResult(await getTodayTimeSummary()))
    )
}
