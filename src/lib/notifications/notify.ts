import { prisma } from "@/lib/prisma"
import { sendEmail } from "./email"
import {
    newRequestForAdminsEmail,
    requestApprovedEmail,
    requestRejectedEmail,
} from "./email-templates"
import {
    sendPushNotification,
    sendPushToAdmins,
} from "@/app/(protected)/profile/actions/notification-actions"

interface NotifyAdminsNewRequestParams {
    requestId: string
    userName: string
    requestType: string
    startDate: Date
    endDate: Date
    reason?: string
}

export async function notifyAdminsNewRequest(params: NotifyAdminsNewRequestParams) {
    try {
        const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true, email: true, name: true },
        })

        if (admins.length === 0) {
            console.warn("No admins found to notify")
            return { success: true, emailsSent: 0, pushSent: 0 }
        }

        const requestTypeLabels: Record<string, string> = {
            VACATION: "Vacation",
            SICK_LEAVE: "Sick Leave",
            WORK_FROM_HOME: "Work from Home",
            OTHER: "Other",
        }

        const requestTypeLabel = requestTypeLabels[params.requestType] || params.requestType

        await sendPushToAdmins({
            title: "New Time-Off Request",
            body: `${params.userName} has submitted a new ${requestTypeLabel} request`,
            url: "/admin/pending-requests",
        })

        const emailResults = await Promise.allSettled(
            admins.map((admin) =>
                sendEmail(
                    admin.email,
                    `New Request: ${params.userName} - ${requestTypeLabel}`,
                    newRequestForAdminsEmail(
                        {
                            userName: params.userName,
                            requestType: params.requestType,
                            startDate: params.startDate,
                            endDate: params.endDate,
                            reason: params.reason,
                        },
                        "en"
                    )
                )
            )
        )

        const emailsSent = emailResults.filter((r) => r.status === "fulfilled").length

        return { success: true, emailsSent, notified: admins.length }
    } catch (error) {
        console.error("Error notifying admins:", error)
        return { success: false, error: "Failed to notify admins" }
    }
}

interface NotifyUserApprovalParams {
    userId: string
    userName: string
    requestType: string
    startDate: Date
    endDate: Date
    reason?: string
    approvedByName: string
}

export async function notifyUserApproval(params: NotifyUserApprovalParams) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.userId },
            select: { email: true },
        })

        if (!user) {
            console.warn("User not found for approval notification")
            return { success: false, error: "User not found" }
        }

        const requestTypeLabels: Record<string, string> = {
            VACATION: "Vacation",
            SICK_LEAVE: "Sick Leave",
            WORK_FROM_HOME: "Work from Home",
            OTHER: "Other",
        }

        const requestTypeLabel = requestTypeLabels[params.requestType] || params.requestType

        await sendPushNotification(params.userId, {
            title: "Request Approved ✓",
            body: `Your ${requestTypeLabel} request has been approved`,
            url: "/requests",
        })

        await sendEmail(
            user.email,
            `Request Approved: ${requestTypeLabel}`,
            requestApprovedEmail(
                {
                    userName: params.userName,
                    requestType: params.requestType,
                    startDate: params.startDate,
                    endDate: params.endDate,
                    reason: params.reason,
                },
                params.approvedByName,
                "en"
            )
        )

        return { success: true }
    } catch (error) {
        console.error("Error notifying user of approval:", error)
        return { success: false, error: "Failed to notify user" }
    }
}

interface NotifyUserRejectionParams {
    userId: string
    userName: string
    requestType: string
    startDate: Date
    endDate: Date
    reason?: string
    rejectedByName: string
    rejectionReason: string
}

export async function notifyUserRejection(params: NotifyUserRejectionParams) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.userId },
            select: { email: true },
        })

        if (!user) {
            console.warn("User not found for rejection notification")
            return { success: false, error: "User not found" }
        }

        const requestTypeLabels: Record<string, string> = {
            VACATION: "Vacation",
            SICK_LEAVE: "Sick Leave",
            WORK_FROM_HOME: "Work from Home",
            OTHER: "Other",
        }

        const requestTypeLabel = requestTypeLabels[params.requestType] || params.requestType

        await sendPushNotification(params.userId, {
            title: "Request Rejected",
            body: `Your ${requestTypeLabel} request has been rejected`,
            url: "/requests",
        })

        await sendEmail(
            user.email,
            `Request Rejected: ${requestTypeLabel}`,
            requestRejectedEmail(
                {
                    userName: params.userName,
                    requestType: params.requestType,
                    startDate: params.startDate,
                    endDate: params.endDate,
                    reason: params.reason,
                },
                params.rejectedByName,
                params.rejectionReason,
                "en"
            )
        )

        return { success: true }
    } catch (error) {
        console.error("Error notifying user of rejection:", error)
        return { success: false, error: "Failed to notify user" }
    }
}
