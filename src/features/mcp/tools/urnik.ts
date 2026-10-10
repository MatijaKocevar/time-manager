import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import { getTodayDayInfo } from "@/app/(protected)/urnik-net-overview/_actions/clock-actions"
import { fetchTeamStatus } from "@/app/(protected)/urnik-net-overview/attendance/_actions/attendance-actions"
import {
    fetchDayDetail,
    fetchMonthlyHours,
} from "@/app/(protected)/urnik-net-overview/hours/_actions/hours-actions"
import {
    fetchUrnikNetRequests,
    getSubmittedUrnikNetRequests,
} from "@/app/(protected)/urnik-net-overview/requests/_actions/urnik-net-requests-actions"
import { jsonResult, runTool } from "../lib/tool-helpers"

const monthSchema = z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .describe("Month in YYYY-MM format")

const dateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe("Date in YYYY-MM-DD format")

function parseMonth(month: string) {
    const [year, monthNumber] = month.split("-").map(Number)

    return { year, month: monthNumber }
}

function parseDate(date: string) {
    const [year, month, day] = date.split("-").map(Number)

    return { year, month, day }
}

export function registerUrnikTools(server: McpServer) {
    server.registerTool(
        "get_urnik_day_info",
        {
            title: "Get urnik.net day info",
            description:
                "Today's urnik.net day info: arrival, departure, lunch break, total and overtime hours, balances and " +
                "vacation days. Requires linked urnik.net credentials; reads live from urnik.net.",
        },
        async (ctx) => runTool(ctx, async () => jsonResult(await getTodayDayInfo()))
    )

    server.registerTool(
        "get_urnik_monthly_hours",
        {
            title: "Get urnik.net monthly hours",
            description:
                "Monthly hours table from urnik.net with per-day rows, summary (billing hours, planned hours, work " +
                "days, holidays, vacation balance, sick leave, balance) and validation warnings. Requires linked " +
                "urnik.net credentials; reads live from urnik.net.",
            inputSchema: z.object({
                month: monthSchema.describe("Month to fetch, e.g. 2026-10"),
            }),
        },
        async ({ month }, ctx) =>
            runTool(ctx, async () => {
                const range = parseMonth(month)

                return jsonResult(await fetchMonthlyHours(range.year, range.month))
            })
    )

    server.registerTool(
        "get_urnik_day_detail",
        {
            title: "Get urnik.net day detail",
            description:
                "Detailed urnik.net entries for a single day (arrival/departure entries, work without break, lunch " +
                "break, with break). Requires linked urnik.net credentials; reads live from urnik.net.",
            inputSchema: z.object({
                date: dateSchema.describe("Day to fetch, e.g. 2026-10-10"),
            }),
        },
        async ({ date }, ctx) =>
            runTool(ctx, async () => {
                const parts = parseDate(date)

                return jsonResult(await fetchDayDetail(parts.year, parts.month, parts.day))
            })
    )

    server.registerTool(
        "get_urnik_requests",
        {
            title: "Get urnik.net requests",
            description:
                "The user's requests as shown on urnik.net (My Requests): number, type, period, days, hours, " +
                "arrival/departure, status and notes. Requires linked urnik.net credentials; reads live from urnik.net.",
            inputSchema: z.object({
                month: monthSchema
                    .optional()
                    .describe("Only requests whose period is in this month"),
            }),
        },
        async ({ month }, ctx) =>
            runTool(ctx, async () => jsonResult(await fetchUrnikNetRequests(month)))
    )

    server.registerTool(
        "list_submitted_urnik_requests",
        {
            title: "List submitted urnik.net requests",
            description:
                "Locally stored urnik.net submissions with their sync status (PENDING, CONFIRMED, REJECTED), hours, " +
                "type and error messages. Read from Time Manager, no urnik.net call.",
        },
        async (ctx) => runTool(ctx, async () => jsonResult(await getSubmittedUrnikNetRequests()))
    )

    server.registerTool(
        "get_urnik_team_status",
        {
            title: "Get urnik.net team status",
            description:
                "Team presence from urnik.net: which colleagues are currently present or absent. Requires linked " +
                "urnik.net credentials; reads live from urnik.net.",
        },
        async (ctx) => runTool(ctx, async () => jsonResult(await fetchTeamStatus()))
    )
}
