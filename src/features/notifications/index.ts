export { NotificationsDropdown } from "./components/notifications-dropdown"
export type {
    NotificationData,
    UserNotification,
    PendingRequestNotification,
} from "./actions/notification-actions"
export {
    getNotifications,
    getUnreadNotificationCount,
    markNotificationsAsRead,
    cleanupOldNotifications,
    subscribeUser,
    unsubscribeUser,
    sendPushNotification,
    hasUserSubscription,
    sendPushToAdmins,
    getNotificationPreferences,
    updateNotificationPreferences,
} from "./actions/notification-actions"
export type { UpdateNotificationPreferencesInput } from "./schemas/notification-schemas"
export { UpdateNotificationPreferencesSchema } from "./schemas/notification-schemas"
export { sendEmail } from "./lib/email"
export {
    newRequestForAdminsEmail,
    requestApprovedEmail,
    requestRejectedEmail,
    requestCancelledEmail,
    verificationEmail,
} from "./lib/email-templates"
export {
    notifyAdminsNewRequest,
    notifyUserApproval,
    notifyUserRejection,
    notifyUserCancellation,
} from "./lib/notify"
export { notificationKeys } from "./query-keys"
