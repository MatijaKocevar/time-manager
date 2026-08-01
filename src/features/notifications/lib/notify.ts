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

const REQUEST_TYPE_LABELS: Record<string, string> = {
    VACATION: "Vacation",
    SICK_LEAVE: "Sick Leave",
    WORK_FROM_HOME: "Work from Home",
}

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

interface PushPayload {
    title: string
    body: string
    url?: string
    actions?: Array<{ action: string; title: string }>
    data?: Record<string, unknown>
}

interface SendUserNotificationParams {
    userId: string
    notificationType: NotificationType
    notificationTitle: string
    notificationMessage: string
    notificationUrl?: string
    notificationMetadata?: Record<string, unknown>
    pushPreferenceKey?:
        | "pushNewRequest"
        | "pushRequestApproved"
        | "pushRequestRejected"
        | "pushRequestCancelled"
        | "pushAutoCheckin"
        | "pushAutoCheckout"
    pushPayload?: PushPayload
    emailPreferenceKey?:
        | "emailNewRequest"
        | "emailRequestApproved"
        | "emailRequestRejected"
        | "emailRequestCancelled"
        | "emailAutoCheckin"
        | "emailAutoCheckout"
    emailSubject?: string
    buildEmailHtml?: (locale: "en" | "sl") => string | Promise<string>
}

async function sendUserNotification(params: SendUserNotificationParams) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.userId },
            select: { email: true, locale: true },
        })

        if (!user) {
            console.warn("User not found for notification:", params.notificationType)
            return { success: false, pushSent: false, emailSent: false, error: "User not found" }
        }

        const preferences = await getOrCreatePreferences(params.userId)

        let pushSent = false
        let emailSent = false

        if (
            params.pushPreferenceKey &&
            params.pushPayload &&
            preferences[params.pushPreferenceKey]
        ) {
            try {
                await sendPushNotification(params.userId, params.pushPayload)
                pushSent = true
            } catch (error) {
                console.error(`Failed to send push to ${params.userId}:`, error)
            }
        }

        await createNotificationRecord(
            params.userId,
            params.notificationType,
            params.notificationTitle,
            params.notificationMessage,
            params.notificationUrl,
            params.notificationMetadata
        )

        if (
            params.emailPreferenceKey &&
            params.buildEmailHtml &&
            preferences[params.emailPreferenceKey]
        ) {
            const locale = (user.locale === "sl" ? "sl" : "en") as "en" | "sl"
            const html = await params.buildEmailHtml(locale)
            const result = await sendEmail(user.email, params.emailSubject!, html)
            emailSent = result.success
        }

        return { success: true, pushSent, emailSent }
    } catch (error) {
        console.error("Error in sendUserNotification:", error)
        return {
            success: false,
            pushSent: false,
            emailSent: false,
            error: "Failed to send notification",
        }
    }
}

interface NotifyAdminsNewRequestParams {
    requestId: string
    requestUserId: string
    userName: string
    requestType: string
    startDate: Date
    endDate: Date
    reason?: string
    autoApproved?: boolean
}

export async function notifyAdminsNewRequest(params: NotifyAdminsNewRequestParams) {
    try {
        const admins = await prisma.user.findMany({
            where: {
                role: "ADMIN",
                id: { not: params.requestUserId },
                OR: [
                    { managedUsers: { none: {} } },
                    { managedUsers: { some: { userId: params.requestUserId } } },
                ],
            },
            select: { id: true, email: true, name: true, locale: true },
        })

        if (admins.length === 0) {
            console.warn("No admins found to notify")
            return { success: true, emailsSent: 0, pushSent: 0 }
        }

        const requestTypeLabel = REQUEST_TYPE_LABELS[params.requestType] || params.requestType

        const notificationTitle = params.autoApproved
            ? "Request Auto-Approved"
            : "New Time-Off Request"
        const notificationBody = params.autoApproved
            ? `${params.userName} submitted a ${requestTypeLabel} request (auto-approved)`
            : `${params.userName} has submitted a new ${requestTypeLabel} request`

        let pushSent = 0
        let emailsSent = 0

        for (const admin of admins) {
            const result = await sendUserNotification({
                userId: admin.id,
                notificationType: "REQUEST_SUBMITTED",
                notificationTitle,
                notificationMessage: notificationBody,
                notificationUrl: "/admin/pending-requests",
                notificationMetadata: {
                    requestId: params.requestId,
                    requestType: params.requestType,
                    userName: params.userName,
                    autoApproved: params.autoApproved ?? false,
                },
                pushPreferenceKey: "pushNewRequest",
                pushPayload: {
                    title: notificationTitle,
                    body: notificationBody,
                    url: "/admin/pending-requests",
                },
                emailPreferenceKey: "emailNewRequest",
                emailSubject: `${params.autoApproved ? "[Auto-Approved] " : ""}New Request: ${params.userName} - ${requestTypeLabel}`,
                buildEmailHtml: (locale) =>
                    newRequestForAdminsEmail(
                        {
                            userName: params.userName,
                            requestType: params.requestType,
                            startDate: params.startDate,
                            endDate: params.endDate,
                            reason: params.reason,
                        },
                        locale
                    ),
            })
            if (result.pushSent) pushSent++
            if (result.emailSent) emailsSent++
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
    const requestTypeLabel = REQUEST_TYPE_LABELS[params.requestType] || params.requestType
    return sendUserNotification({
        userId: params.userId,
        notificationType: "REQUEST_APPROVED",
        notificationTitle: "Request Approved ✓",
        notificationMessage: `Your ${requestTypeLabel} request has been approved by ${params.approvedByName}`,
        notificationUrl: "/requests",
        notificationMetadata: {
            requestType: params.requestType,
            approvedByName: params.approvedByName,
        },
        pushPreferenceKey: "pushRequestApproved",
        pushPayload: {
            title: "Request Approved ✓",
            body: `Your ${requestTypeLabel} request has been approved`,
            url: "/requests",
        },
        emailPreferenceKey: "emailRequestApproved",
        emailSubject: `Request Approved: ${requestTypeLabel}`,
        buildEmailHtml: (locale) =>
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
            ),
    })
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
    const requestTypeLabel = REQUEST_TYPE_LABELS[params.requestType] || params.requestType
    return sendUserNotification({
        userId: params.userId,
        notificationType: "REQUEST_REJECTED",
        notificationTitle: "Request Rejected",
        notificationMessage: `Your ${requestTypeLabel} request has been rejected by ${params.rejectedByName}`,
        notificationUrl: "/requests",
        notificationMetadata: {
            requestType: params.requestType,
            rejectedByName: params.rejectedByName,
            rejectionReason: params.rejectionReason,
        },
        pushPreferenceKey: "pushRequestRejected",
        pushPayload: {
            title: "Request Rejected",
            body: `Your ${requestTypeLabel} request has been rejected`,
            url: "/requests",
        },
        emailPreferenceKey: "emailRequestRejected",
        emailSubject: `Request Rejected: ${requestTypeLabel}`,
        buildEmailHtml: (locale) =>
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
            ),
    })
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
    const requestTypeLabel = REQUEST_TYPE_LABELS[params.requestType] || params.requestType
    const notificationMessage = params.cancelledByAdmin
        ? `Your ${requestTypeLabel} request has been cancelled by ${params.cancelledByName}`
        : `Your ${requestTypeLabel} request has been cancelled`

    return sendUserNotification({
        userId: params.userId,
        notificationType: "REQUEST_CANCELLED",
        notificationTitle: "Request Cancelled",
        notificationMessage,
        notificationUrl: "/requests",
        notificationMetadata: {
            requestType: params.requestType,
            cancelledByName: params.cancelledByName,
            cancellationReason: params.cancellationReason,
            cancelledByAdmin: params.cancelledByAdmin,
        },
        pushPreferenceKey: "pushRequestCancelled",
        pushPayload: {
            title: "Request Cancelled",
            body: `Your ${requestTypeLabel} request has been cancelled`,
            url: "/requests",
        },
        emailPreferenceKey: "emailRequestCancelled",
        emailSubject: `Request Cancelled: ${requestTypeLabel}`,
        buildEmailHtml: (locale) =>
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
            ),
    })
}

interface NotifyAutoCheckinReminderParams {
    userId: string
    userName: string
    workStartTime: string
}

export async function notifyAutoCheckinReminder(params: NotifyAutoCheckinReminderParams) {
    return sendUserNotification({
        userId: params.userId,
        notificationType: "AUTO_CHECKIN_REMINDER",
        notificationTitle: "Auto Check-In Reminder",
        notificationMessage: `Your work starts at ${params.workStartTime}. System will automatically log your arrival if you don't check in manually.`,
        notificationUrl: "/urnik-net-overview",
        notificationMetadata: {
            workStartTime: params.workStartTime,
        },
        pushPreferenceKey: "pushAutoCheckin",
        pushPayload: {
            title: "Auto Check-In Reminder",
            body: `Your work starts at ${params.workStartTime}. Auto check-in will happen soon if you don't log in manually.`,
            url: "/urnik-net-overview",
            actions: [
                { action: "delay-15", title: "Delay 15min" },
                { action: "delay-30", title: "Delay 30min" },
                { action: "cancel-auto", title: "Cancel" },
            ],
            data: {
                adjustmentType: "start",
                cancelType: "checkin",
            },
        },
        emailPreferenceKey: "emailAutoCheckin",
        emailSubject: "Auto Check-In Reminder",
        buildEmailHtml: async (locale) => {
            const { autoCheckinReminderEmail } = await import("./email-templates")
            return autoCheckinReminderEmail(params.userName, params.workStartTime, locale)
        },
    })
}

interface NotifyAutoCheckinCompletedParams {
    userId: string
    userName: string
    isWorkFromHome: boolean
}

export async function notifyAutoCheckinCompleted(params: NotifyAutoCheckinCompletedParams) {
    const checkInType = params.isWorkFromHome ? "Work from Home" : "Office"
    return sendUserNotification({
        userId: params.userId,
        notificationType: "AUTO_CHECKIN_COMPLETED",
        notificationTitle: "Auto Check-In Completed",
        notificationMessage: `You've been automatically logged into urnik.net (${checkInType})`,
        notificationUrl: "/urnik-net-overview",
        notificationMetadata: {
            isWorkFromHome: params.isWorkFromHome,
        },
        pushPreferenceKey: "pushAutoCheckin",
        pushPayload: {
            title: "Auto Check-In Completed",
            body: `You've been automatically checked in (${checkInType})`,
            url: "/urnik-net-overview",
        },
        emailPreferenceKey: "emailAutoCheckin",
        emailSubject: "Auto Check-In Completed",
        buildEmailHtml: async (locale) => {
            const { autoCheckinCompletedEmail } = await import("./email-templates")
            return autoCheckinCompletedEmail(params.userName, checkInType, locale)
        },
    })
}

interface NotifyAutoCheckoutReminderParams {
    userId: string
    userName: string
    workEndTime: string
}

export async function notifyAutoCheckoutReminder(params: NotifyAutoCheckoutReminderParams) {
    return sendUserNotification({
        userId: params.userId,
        notificationType: "AUTO_CHECKOUT_REMINDER",
        notificationTitle: "Auto Check-Out Reminder",
        notificationMessage: `Your work ends at ${params.workEndTime}. System will automatically log your departure if you don't check out manually. You can cancel this in your profile.`,
        notificationUrl: "/profile",
        notificationMetadata: {
            workEndTime: params.workEndTime,
        },
        pushPreferenceKey: "pushAutoCheckout",
        pushPayload: {
            title: "Auto Check-Out Reminder",
            body: `Your work ends at ${params.workEndTime}. Auto check-out will happen soon. Visit profile to cancel if needed.`,
            url: "/profile",
            actions: [
                { action: "delay-15", title: "Delay 15min" },
                { action: "delay-30", title: "Delay 30min" },
                { action: "cancel-auto", title: "Cancel" },
            ],
            data: {
                adjustmentType: "end",
                cancelType: "checkout",
            },
        },
        emailPreferenceKey: "emailAutoCheckout",
        emailSubject: "Auto Check-Out Reminder",
        buildEmailHtml: async (locale) => {
            const { autoCheckoutReminderEmail } = await import("./email-templates")
            return autoCheckoutReminderEmail(params.userName, params.workEndTime, locale)
        },
    })
}

interface NotifyAutoCheckoutCompletedParams {
    userId: string
    userName: string
}

export async function notifyAutoCheckoutCompleted(params: NotifyAutoCheckoutCompletedParams) {
    return sendUserNotification({
        userId: params.userId,
        notificationType: "AUTO_CHECKOUT_COMPLETED",
        notificationTitle: "Auto Check-Out Completed",
        notificationMessage: "You've been automatically logged out from urnik.net",
        notificationUrl: "/urnik-net-overview",
        pushPreferenceKey: "pushAutoCheckout",
        pushPayload: {
            title: "Auto Check-Out Completed",
            body: "You've been automatically checked out",
            url: "/urnik-net-overview",
        },
        emailPreferenceKey: "emailAutoCheckout",
        emailSubject: "Auto Check-Out Completed",
        buildEmailHtml: async (locale) => {
            const { autoCheckoutCompletedEmail } = await import("./email-templates")
            return autoCheckoutCompletedEmail(params.userName, locale)
        },
    })
}
