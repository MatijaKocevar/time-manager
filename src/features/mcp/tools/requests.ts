import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import {
    cancelApprovedRequest,
    cancelRequest,
    createRequest,
    updateRequest,
} from "@/app/(protected)/requests/_actions/request-mutations"
import { approveRequest, rejectRequest } from "@/app/(protected)/requests/_actions/request-approval"
import {
    getAllRequests,
    getUserRequests,
    getUserRequestsForAdmin,
} from "@/app/(protected)/requests/_actions/request-queries"
import type { RequestDisplay } from "@/app/(protected)/requests/_schemas/request-schemas"
import type { AuthIdentity } from "@/lib/auth-identity"
import { errorResult, jsonResult, runTool } from "../lib/tool-helpers"

const requestTypeSchema = z
    .enum(["VACATION", "SICK_LEAVE", "WORK_FROM_HOME", "WORK", "OVERTIME_USE"])
    .describe("VACATION, SICK_LEAVE, WORK_FROM_HOME, WORK or OVERTIME_USE")

const requestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])

const dateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe("Date in YYYY-MM-DD format")

const timeSchema = z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .describe("Time in HH:MM (24-hour) format")

function toRequestSummary(request: RequestDisplay, includeUser = false) {
    return {
        id: request.id,
        type: request.type,
        status: request.status,
        startDate: request.startDate,
        endDate: request.endDate,
        startTime: request.startTime,
        endTime: request.endTime,
        isFullDay: request.isFullDay,
        requestedHours: request.requestedHours,
        reason: request.reason,
        location: request.location,
        urnikNetStatus: request.urnikNetStatus,
        approvedBy: request.approver?.name ?? null,
        rejectedBy: request.rejector?.name ?? null,
        rejectionReason: request.rejectionReason,
        cancelledBy: request.canceller?.name ?? null,
        cancellationReason: request.cancellationReason,
        createdAt: request.createdAt,
        ...(includeUser
            ? {
                  userId: request.userId,
                  userName: request.user?.name ?? null,
                  userEmail: request.user?.email ?? null,
              }
            : {}),
    }
}

function requireAdminIdentity(identity: AuthIdentity) {
    if (identity.role !== "ADMIN") {
        return errorResult("Admin access required")
    }

    return null
}

export function registerRequestTools(server: McpServer) {
    server.registerTool(
        "list_my_requests",
        {
            title: "List my requests",
            description:
                "List the authenticated user's time-off and absence requests (vacation, sick leave, work from home, work, " +
                "overtime use), newest first, with status, dates and approver/rejector/canceller details.",
        },
        async (ctx) =>
            runTool(ctx, async () =>
                jsonResult((await getUserRequests()).map((request) => toRequestSummary(request)))
            )
    )

    server.registerTool(
        "create_request",
        {
            title: "Create request",
            description:
                "Create a time-off or absence request for the authenticated user. Full day by default; set isFullDay false " +
                "and provide startTime/endTime (HH:MM) for a partial day. OVERTIME_USE is a single day with " +
                "startTime/endTime and is blocked when it exceeds the available overtime balance. The request starts as " +
                "PENDING for admin approval. With sendToUrnikNet true and linked Urnik.net credentials it is submitted to " +
                "Urnik.net instead; submission failures fall back to normal admin approval.",
            inputSchema: z.object({
                type: requestTypeSchema,
                startDate: dateSchema.describe("First day"),
                endDate: dateSchema.describe(
                    "Last day; same as startDate for a single day; for OVERTIME_USE must equal startDate"
                ),
                isFullDay: z
                    .boolean()
                    .optional()
                    .describe("Default true; false for a partial day; ignored for OVERTIME_USE"),
                startTime: timeSchema
                    .optional()
                    .describe("Required when isFullDay is false; required for OVERTIME_USE"),
                endTime: timeSchema
                    .optional()
                    .describe("Required when isFullDay is false; required for OVERTIME_USE"),
                reason: z.string().optional(),
                location: z
                    .string()
                    .optional()
                    .describe("Optional location, e.g. for WORK_FROM_HOME"),
                skipWeekends: z
                    .boolean()
                    .optional()
                    .describe("Skip weekends when generating hours (default true)"),
                skipHolidays: z
                    .boolean()
                    .optional()
                    .describe("Skip holidays when generating hours (default true)"),
                sendToUrnikNet: z
                    .boolean()
                    .optional()
                    .describe(
                        "Submit the request to Urnik.net (requires linked credentials); default false keeps it in Time Manager"
                    ),
            }),
        },
        async (input, ctx) =>
            runTool(ctx, async () => {
                const result = await createRequest(input)

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )

    server.registerTool(
        "update_request",
        {
            title: "Update request",
            description:
                "Update a pending request's type, dates, reason or location. Only pending requests that were not " +
                "submitted to Urnik.net can be edited.",
            inputSchema: z.object({
                id: z.string().describe("Request id"),
                type: requestTypeSchema.optional(),
                startDate: dateSchema.optional(),
                endDate: dateSchema.optional(),
                reason: z.string().optional(),
                location: z.string().optional(),
            }),
        },
        async (input, ctx) =>
            runTool(ctx, async () => {
                const result = await updateRequest(input)

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )

    server.registerTool(
        "cancel_request",
        {
            title: "Cancel request",
            description: "Cancel one of the authenticated user's own pending requests.",
            inputSchema: z.object({
                id: z.string().describe("Request id"),
            }),
        },
        async ({ id }, ctx) =>
            runTool(ctx, async () => {
                const result = await cancelRequest({ id })

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )

    server.registerTool(
        "list_all_requests",
        {
            title: "List all requests (admin)",
            description:
                "Admin only. List requests across all users, optionally filtered by status and/or userId. " +
                "Use this to find request ids for approve_request, reject_request and cancel_approved_request.",
            inputSchema: z.object({
                status: z.array(requestStatusSchema).optional().describe("Only these statuses"),
                userId: z
                    .string()
                    .optional()
                    .describe("Only this user's requests; omit for everyone"),
            }),
        },
        async ({ status, userId }, ctx) =>
            runTool(ctx, async (identity) => {
                const denied = requireAdminIdentity(identity)

                if (denied) {
                    return denied
                }

                const requests = userId
                    ? await getUserRequestsForAdmin(userId, status)
                    : await getAllRequests(status)

                return jsonResult(requests.map((request) => toRequestSummary(request, true)))
            })
    )

    server.registerTool(
        "approve_request",
        {
            title: "Approve request (admin)",
            description:
                "Admin only. Approve a pending request; requests must be processed in submission order (FIFO). " +
                "Approval creates the schedule and hour entries.",
            inputSchema: z.object({
                id: z.string().describe("Request id"),
            }),
        },
        async ({ id }, ctx) =>
            runTool(ctx, async (identity) => {
                const denied = requireAdminIdentity(identity)

                if (denied) {
                    return denied
                }

                const result = await approveRequest({ id })

                if ("error" in result) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )

    server.registerTool(
        "reject_request",
        {
            title: "Reject request (admin)",
            description:
                "Admin only. Reject a pending request with an optional reason; requests must be processed in submission order (FIFO).",
            inputSchema: z.object({
                id: z.string().describe("Request id"),
                rejectionReason: z.string().optional(),
            }),
        },
        async ({ id, rejectionReason }, ctx) =>
            runTool(ctx, async (identity) => {
                const denied = requireAdminIdentity(identity)

                if (denied) {
                    return denied
                }

                const result = await rejectRequest({ id, rejectionReason })

                if ("error" in result) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )

    server.registerTool(
        "cancel_approved_request",
        {
            title: "Cancel approved request (admin)",
            description:
                "Admin only. Cancel an approved request; a cancellation reason is required.",
            inputSchema: z.object({
                id: z.string().describe("Request id"),
                cancellationReason: z
                    .string()
                    .min(1)
                    .describe("Why the approved request is cancelled"),
            }),
        },
        async ({ id, cancellationReason }, ctx) =>
            runTool(ctx, async (identity) => {
                const denied = requireAdminIdentity(identity)

                if (denied) {
                    return denied
                }

                const result = await cancelApprovedRequest({ id, cancellationReason })

                if (result.error) {
                    return errorResult(result.error)
                }

                return jsonResult(result)
            })
    )
}
