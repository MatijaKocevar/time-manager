import { prisma } from "@/lib/prisma"
import { sendEmail } from "./email"
import {
    newRequestForAdminsEmail,
    requestApprovedEmail,
    requestRejectedEmail,
    requestCancelledEmail,
} from "./email-templates"
import { sendPushNotification } from "../actions/notification-actions"
import type { NotificationType } from "../../../../prisma/generated/client"

async function getOrCreatePreferences(userId: string) {
    let preferences = await prisma.notificationPreference.findUnique({
        where: { userId },
    })

    if (!preferences) {
        preferences = await prisma.notificationPreference.create({
            data: { userId },
        })
    }

    return preferences
}

async function createNotificationRecord(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    url?: string,
    metadata?: Record<string, unknown>
) {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                url,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
            },
        })
    } catch (error) {
        console.error("Failed to create notification record:", error)
    }
}

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
            select: { id: true, email: true, name: true, locale: true },
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

        let pushSent = 0
        let emailsSent = 0

        for (const admin of admins) {
            const preferences = await getOrCreatePreferences(admin.id)

            if (preferences.pushNewRequest) {
                try {
                    await sendPushNotification(admin.id, {
                        title: "New Time-Off Request",
                        body: `${params.userName} has submitted a new ${requestTypeLabel} request`,
                        url: "/admin/pending-requests",
                    })
                    pushSent++
                } catch (error) {
                    console.error(`Failed to send push to admin ${admin.id}:`, error)
                }
            }

            await createNotificationRecord(
                admin.id,
                "REQUEST_SUBMITTED",
                "New Time-Off Request",
                `${params.userName} has submitted a new ${requestTypeLabel} request`,
                "/admin/pending-requests",
                {
                    requestId: params.requestId,
                    requestType: params.requestType,
                    userName: params.userName,
                }
            )

            if (preferences.emailNewRequest) {
                const locale = (admin.locale === "sl" ? "sl" : "en") as "en" | "sl"
                const emailResult = await sendEmail(
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
                        locale
                    )
                )
                if (emailResult.success) {
                    emailsSent++
                }
            }
        }

        return { success: true, emailsSent, pushSent, notified: admins.length }
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
            select: { email: true, locale: true },
        })

        if (!user) {
            console.warn("User not found for approval notification")
            return { success: false, error: "User not found" }
        }

        const preferences = await getOrCreatePreferences(params.userId)

        const requestTypeLabels: Record<string, string> = {
            VACATION: "Vacation",
            SICK_LEAVE: "Sick Leave",
            WORK_FROM_HOME: "Work from Home",
            OTHER: "Other",
        }

        const requestTypeLabel = requestTypeLabels[params.requestType] || params.requestType
        const locale = (user.locale === "sl" ? "sl" : "en") as "en" | "sl"

        if (preferences.pushRequestApproved) {
            await sendPushNotification(params.userId, {
                title: "Request Approved ✓",
                body: `Your ${requestTypeLabel} request has been approved`,
                url: "/requests",
            })
        }

        await createNotificationRecord(
            params.userId,
            "REQUEST_APPROVED",
            "Request Approved ✓",
            `Your ${requestTypeLabel} request has been approved by ${params.approvedByName}`,
            "/requests",
            {
                requestType: params.requestType,
                approvedByName: params.approvedByName,
            }
        )

        if (preferences.emailRequestApproved) {
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
                    locale
                )
            )
        }

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
            select: { email: true, locale: true },
        })

        if (!user) {
            console.warn("User not found for rejection notification")
            return { success: false, error: "User not found" }
        }

        const preferences = await getOrCreatePreferences(params.userId)

        const requestTypeLabels: Record<string, string> = {
            VACATION: "Vacation",
            SICK_LEAVE: "Sick Leave",
            WORK_FROM_HOME: "Work from Home",
            OTHER: "Other",
        }

        const requestTypeLabel = requestTypeLabels[params.requestType] || params.requestType
        const locale = (user.locale === "sl" ? "sl" : "en") as "en" | "sl"

        if (preferences.pushRequestRejected) {
            await sendPushNotification(params.userId, {
                title: "Request Rejected",
                body: `Your ${requestTypeLabel} request has been rejected`,
                url: "/requests",
            })
        }

        await createNotificationRecord(
            params.userId,
            "REQUEST_REJECTED",
            "Request Rejected",
            `Your ${requestTypeLabel} request has been rejected by ${params.rejectedByName}`,
            "/requests",
            {
                requestType: params.requestType,
                rejectedByName: params.rejectedByName,
                rejectionReason: params.rejectionReason,
            }
        )

        if (preferences.emailRequestRejected) {
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
                    locale
                )
            )
        }

        return { success: true }
    } catch (error) {
        console.error("Error notifying user of rejection:", error)
        return { success: false, error: "Failed to notify user" }
    }
}

interface NotifyUserCancellationParams {
    userId: string
    userName: string
    requestType: string
    startDate: Date
    endDate: Date
    reason?: string
    cancelledByName: string
    cancellationReason: string
    cancelledByAdmin: boolean
}

export async function notifyUserCancellation(params: NotifyUserCancellationParams) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.userId },
            select: { email: true, locale: true },
        })

        if (!user) {
            console.warn("User not found for cancellation notification")
            return { success: false, error: "User not found" }
        }

        const preferences = await getOrCreatePreferences(params.userId)

        const requestTypeLabels: Record<string, string> = {
            VACATION: "Vacation",
            SICK_LEAVE: "Sick Leave",
            WORK_FROM_HOME: "Work from Home",
            OTHER: "Other",
        }

        const requestTypeLabel = requestTypeLabels[params.requestType] || params.requestType
        const locale = (user.locale === "sl" ? "sl" : "en") as "en" | "sl"

        if (preferences.pushRequestCancelled) {
            await sendPushNotification(params.userId, {
                title: "Request Cancelled",
                body: `Your ${requestTypeLabel} request has been cancelled`,
                url: "/requests",
            })
        }

        await createNotificationRecord(
            params.userId,
            "REQUEST_CANCELLED",
            "Request Cancelled",
            params.cancelledByAdmin
                ? `Your ${requestTypeLabel} request has been cancelled by ${params.cancelledByName}`
                : `Your ${requestTypeLabel} request has been cancelled`,
            "/requests",
            {
                requestType: params.requestType,
                cancelledByName: params.cancelledByName,
                cancellationReason: params.cancellationReason,
                cancelledByAdmin: params.cancelledByAdmin,
            }
        )

        if (preferences.emailRequestCancelled) {
            await sendEmail(
                user.email,
                `Request Cancelled: ${requestTypeLabel}`,
                requestCancelledEmail(
                    {
                        userName: params.userName,
                        requestType: params.requestType,
                        startDate: params.startDate,
                        endDate: params.endDate,
                        reason: params.reason,
                    },
                    params.cancelledByName,
                    params.cancellationReason,
                    params.cancelledByAdmin,
                    locale
                )
            )
        }

        return { success: true }
    } catch (error) {
        console.error("Error notifying user of cancellation:", error)
        return { success: false, error: "Failed to notify user" }
    }
}
