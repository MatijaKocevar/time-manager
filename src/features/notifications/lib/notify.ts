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

        const requestTypeLabels: Record<string, string> = {
            VACATION: "Vacation",
            SICK_LEAVE: "Sick Leave",
            WORK_FROM_HOME: "Work from Home",
        }

        const requestTypeLabel = requestTypeLabels[params.requestType] || params.requestType

        const notificationTitle = params.autoApproved
            ? "Request Auto-Approved"
            : "New Time-Off Request"
        const notificationBody = params.autoApproved
            ? `${params.userName} submitted a ${requestTypeLabel} request (auto-approved)`
            : `${params.userName} has submitted a new ${requestTypeLabel} request`

        let pushSent = 0
        let emailsSent = 0

        for (const admin of admins) {
            const preferences = await getOrCreatePreferences(admin.id)

            if (preferences.pushNewRequest) {
                try {
                    await sendPushNotification(admin.id, {
                        title: notificationTitle,
                        body: notificationBody,
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
                notificationTitle,
                notificationBody,
                "/admin/pending-requests",
                {
                    requestId: params.requestId,
                    requestType: params.requestType,
                    userName: params.userName,
                    autoApproved: params.autoApproved ?? false,
                }
            )

            if (preferences.emailNewRequest) {
                const locale = (admin.locale === "sl" ? "sl" : "en") as "en" | "sl"
                const emailResult = await sendEmail(
                    admin.email,
                    `${params.autoApproved ? "[Auto-Approved] " : ""}New Request: ${params.userName} - ${requestTypeLabel}`,
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

interface NotifyAutoCheckinReminderParams {
    userId: string
    userName: string
    workStartTime: string
}

export async function notifyAutoCheckinReminder(params: NotifyAutoCheckinReminderParams) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.userId },
            select: { email: true, locale: true },
        })

        if (!user) {
            console.warn("User not found for auto check-in reminder")
            return { success: false, error: "User not found" }
        }

        const preferences = await getOrCreatePreferences(params.userId)
        const locale = (user.locale === "sl" ? "sl" : "en") as "en" | "sl"

        if (preferences.pushAutoCheckin) {
            await sendPushNotification(params.userId, {
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
            })
        }

        await createNotificationRecord(
            params.userId,
            "AUTO_CHECKIN_REMINDER",
            "Auto Check-In Reminder",
            `Your work starts at ${params.workStartTime}. System will automatically log your arrival if you don't check in manually.`,
            "/urnik-net-overview",
            {
                workStartTime: params.workStartTime,
            }
        )

        if (preferences.emailAutoCheckin) {
            const { autoCheckinReminderEmail } = await import("./email-templates")
            await sendEmail(
                user.email,
                "Auto Check-In Reminder",
                autoCheckinReminderEmail(params.userName, params.workStartTime, locale)
            )
        }

        return { success: true }
    } catch (error) {
        console.error("Error sending auto check-in reminder:", error)
        return { success: false, error: "Failed to send reminder" }
    }
}

interface NotifyAutoCheckinCompletedParams {
    userId: string
    userName: string
    isWorkFromHome: boolean
}

export async function notifyAutoCheckinCompleted(params: NotifyAutoCheckinCompletedParams) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.userId },
            select: { email: true, locale: true },
        })

        if (!user) {
            console.warn("User not found for auto check-in completion notification")
            return { success: false, error: "User not found" }
        }

        const preferences = await getOrCreatePreferences(params.userId)
        const locale = (user.locale === "sl" ? "sl" : "en") as "en" | "sl"
        const checkInType = params.isWorkFromHome ? "Work from Home" : "Office"

        if (preferences.pushAutoCheckin) {
            await sendPushNotification(params.userId, {
                title: "Auto Check-In Completed",
                body: `You've been automatically checked in (${checkInType})`,
                url: "/urnik-net-overview",
            })
        }

        await createNotificationRecord(
            params.userId,
            "AUTO_CHECKIN_COMPLETED",
            "Auto Check-In Completed",
            `You've been automatically logged into urnik.net (${checkInType})`,
            "/urnik-net-overview",
            {
                isWorkFromHome: params.isWorkFromHome,
            }
        )

        if (preferences.emailAutoCheckin) {
            const { autoCheckinCompletedEmail } = await import("./email-templates")
            await sendEmail(
                user.email,
                "Auto Check-In Completed",
                autoCheckinCompletedEmail(params.userName, checkInType, locale)
            )
        }

        return { success: true }
    } catch (error) {
        console.error("Error sending auto check-in completion notification:", error)
        return { success: false, error: "Failed to notify user" }
    }
}

interface NotifyAutoCheckoutReminderParams {
    userId: string
    userName: string
    workEndTime: string
}

export async function notifyAutoCheckoutReminder(params: NotifyAutoCheckoutReminderParams) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.userId },
            select: { email: true, locale: true },
        })

        if (!user) {
            console.warn("User not found for auto check-out reminder")
            return { success: false, error: "User not found" }
        }

        const preferences = await getOrCreatePreferences(params.userId)
        const locale = (user.locale === "sl" ? "sl" : "en") as "en" | "sl"

        if (preferences.pushAutoCheckout) {
            await sendPushNotification(params.userId, {
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
            })
        }

        await createNotificationRecord(
            params.userId,
            "AUTO_CHECKOUT_REMINDER",
            "Auto Check-Out Reminder",
            `Your work ends at ${params.workEndTime}. System will automatically log your departure if you don't check out manually. You can cancel this in your profile.`,
            "/profile",
            {
                workEndTime: params.workEndTime,
            }
        )

        if (preferences.emailAutoCheckout) {
            const { autoCheckoutReminderEmail } = await import("./email-templates")
            await sendEmail(
                user.email,
                "Auto Check-Out Reminder",
                autoCheckoutReminderEmail(params.userName, params.workEndTime, locale)
            )
        }

        return { success: true }
    } catch (error) {
        console.error("Error sending auto check-out reminder:", error)
        return { success: false, error: "Failed to send reminder" }
    }
}

interface NotifyAutoCheckoutCompletedParams {
    userId: string
    userName: string
}

export async function notifyAutoCheckoutCompleted(params: NotifyAutoCheckoutCompletedParams) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.userId },
            select: { email: true, locale: true },
        })

        if (!user) {
            console.warn("User not found for auto check-out completion notification")
            return { success: false, error: "User not found" }
        }

        const preferences = await getOrCreatePreferences(params.userId)
        const locale = (user.locale === "sl" ? "sl" : "en") as "en" | "sl"

        if (preferences.pushAutoCheckout) {
            await sendPushNotification(params.userId, {
                title: "Auto Check-Out Completed",
                body: "You've been automatically checked out",
                url: "/urnik-net-overview",
            })
        }

        await createNotificationRecord(
            params.userId,
            "AUTO_CHECKOUT_COMPLETED",
            "Auto Check-Out Completed",
            "You've been automatically logged out from urnik.net",
            "/urnik-net-overview"
        )

        if (preferences.emailAutoCheckout) {
            const { autoCheckoutCompletedEmail } = await import("./email-templates")
            await sendEmail(
                user.email,
                "Auto Check-Out Completed",
                autoCheckoutCompletedEmail(params.userName, locale)
            )
        }

        return { success: true }
    } catch (error) {
        console.error("Error sending auto check-out completion notification:", error)
        return { success: false, error: "Failed to notify user" }
    }
}
