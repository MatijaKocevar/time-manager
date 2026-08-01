"use server"

import { validateInput } from "@/lib/validation"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-helpers"
import {
    ApproveRequestSchema,
    RejectRequestSchema,
    type ApproveRequestInput,
    type RejectRequestInput,
} from "../_schemas/request-schemas"
import { executeApproval, executeRejection } from "./request-helpers"

export async function approveRequest(input: ApproveRequestInput) {
    try {
        const session = await requireAdmin()

        const validation = validateInput(ApproveRequestSchema, input)
        if (!validation.success) {
            return { error: validation.error }
        }

        const { id } = validation.data

        const request = await prisma.request.findUnique({
            where: { id },
        })

        if (!request) {
            return { error: "Request not found" }
        }

        if (request.status !== "PENDING") {
            return { error: "Can only approve pending requests" }
        }

        if (request.urnikNetSynced && request.urnikNetStatus === "PENDING") {
            return {
                error: "Cannot approve - this request is synced to Urnik.net and must be approved there",
            }
        }

        const earlierPendingRequests = await prisma.request.count({
            where: {
                userId: request.userId,
                status: "PENDING",
                createdAt: { lt: request.createdAt },
            },
        })

        if (earlierPendingRequests > 0) {
            return {
                error: `Cannot approve - ${earlierPendingRequests} earlier pending request(s) must be processed first. Approve requests in submission order.`,
            }
        }

        return executeApproval(request, session.user.id)
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to approve request" }
    }
}

export async function rejectRequest(input: RejectRequestInput) {
    try {
        const session = await requireAdmin()

        const validation = validateInput(RejectRequestSchema, input)
        if (!validation.success) {
            return { error: validation.error }
        }

        const { id, rejectionReason } = validation.data

        const request = await prisma.request.findUnique({
            where: { id },
        })

        if (!request) {
            return { error: "Request not found" }
        }

        if (request.status !== "PENDING") {
            return { error: "Can only reject pending requests" }
        }

        if (request.urnikNetSynced && request.urnikNetStatus === "PENDING") {
            return {
                error: "Cannot reject - this request is synced to Urnik.net and must be rejected there",
            }
        }

        const earlierPendingRequests = await prisma.request.count({
            where: {
                userId: request.userId,
                status: "PENDING",
                createdAt: { lt: request.createdAt },
            },
        })

        if (earlierPendingRequests > 0) {
            return {
                error: `Cannot reject - ${earlierPendingRequests} earlier pending request(s) must be processed first. Process requests in submission order.`,
            }
        }

        return executeRejection(request, rejectionReason, session.user.id)
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to reject request" }
    }
}

export async function systemApproveRequest(requestId: string) {
    try {
        const request = await prisma.request.findUnique({
            where: { id: requestId },
        })

        if (!request) {
            return { error: "Request not found" }
        }

        if (request.status !== "PENDING") {
            return { error: "Can only approve pending requests" }
        }

        return executeApproval(request)
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to system-approve request" }
    }
}

export async function systemRejectRequest(requestId: string, rejectionReason: string) {
    try {
        const request = await prisma.request.findUnique({
            where: { id: requestId },
        })

        if (!request) {
            return { error: "Request not found" }
        }

        if (request.status !== "PENDING") {
            return { error: "Can only reject pending requests" }
        }

        return executeRejection(request, rejectionReason)
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to system-reject request" }
    }
}
