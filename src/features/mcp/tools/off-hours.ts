import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import {
    getOffHoursPreview,
    reclassifyOffHours,
    undoOffHours,
} from "@/app/(protected)/hours/_actions/off-hours-actions"
import { errorResult, jsonResult, runTool } from "../lib/tool-helpers"

const dateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe("Date in YYYY-MM-DD format")

const timeSchema = z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .describe("Time of day in HH:mm format, e.g. 16:34")

export function registerOffHoursTools(server: McpServer) {
    server.registerTool(
        "preview_off_hours",
        {
            title: "Preview off-hours reclassification",
            description:
                "Read-only preview of moving a day's time window to OFF_HOURS (counts toward the project, not toward " +
                "working hours). Returns the affected entries, entries that would be split at the window edges, " +
                "manual entries and the total hours that would move.",
            inputSchema: z.object({
                date: dateSchema.describe("Day being reclassified"),
                from: timeSchema.describe("Window start, e.g. 16:34"),
                to: timeSchema.describe("Window end, e.g. 23:59"),
                includeManual: z
                    .boolean()
                    .optional()
                    .describe("Also convert manual entries of that day (whole entries only)"),
            }),
        },
        async ({ date, from, to, includeManual }, ctx) =>
            runTool(ctx, async () => {
                const result = await getOffHoursPreview({
                    date,
                    from,
                    to,
                    includeManual: includeManual ?? false,
                })

                if ("error" in result) {
                    return errorResult(result.error)
                }

                return jsonResult(result.data)
            })
    )

    server.registerTool(
        "reclassify_off_hours",
        {
            title: "Reclassify time as off-hours",
            description:
                "Move a day's time window to OFF_HOURS. Only work-type entries are touched, entries crossing the window " +
                "edges are split, and re-running is idempotent. Defaults to dryRun=true and returns the preview without " +
                "writing anything; call again with dryRun=false to apply. Returns updated/created counts, hours moved " +
                "and the window id (used by undo_off_hours).",
            inputSchema: z.object({
                date: dateSchema.describe("Day being reclassified"),
                from: timeSchema.describe("Window start"),
                to: timeSchema.describe("Window end"),
                includeManual: z
                    .boolean()
                    .optional()
                    .describe("Also convert manual entries of that day (whole entries only)"),
                applyToFuture: z
                    .boolean()
                    .optional()
                    .describe("Also route new timers started inside the window to OFF_HOURS"),
                dryRun: z
                    .boolean()
                    .optional()
                    .describe("Preview only (default true); set false to apply"),
            }),
        },
        async ({ date, from, to, includeManual, applyToFuture, dryRun }, ctx) =>
            runTool(ctx, async () => {
                const includeManualValue = includeManual ?? false

                if (dryRun !== false) {
                    const preview = await getOffHoursPreview({
                        date,
                        from,
                        to,
                        includeManual: includeManualValue,
                    })

                    if ("error" in preview) {
                        return errorResult(preview.error)
                    }

                    return jsonResult({ dryRun: true, preview: preview.data })
                }

                const result = await reclassifyOffHours({
                    date,
                    from,
                    to,
                    includeManual: includeManualValue,
                    applyToFuture: applyToFuture ?? false,
                })

                if ("error" in result) {
                    return errorResult(result.error)
                }

                return jsonResult({ dryRun: false, ...result.data })
            })
    )

    server.registerTool(
        "undo_off_hours",
        {
            title: "Undo off-hours reclassification",
            description:
                "Revert a reclassify_off_hours run by window id: converted entries go back to WORK and split entries are " +
                "merged back together.",
            inputSchema: z.object({
                windowId: z.string().describe("Window id returned by reclassify_off_hours"),
            }),
        },
        async ({ windowId }, ctx) =>
            runTool(ctx, async () => {
                const result = await undoOffHours({ windowId })

                if ("error" in result) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )
}
