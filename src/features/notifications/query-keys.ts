export const notificationKeys = {
    all: ["notifications"] as const,
    lists: () => [...notificationKeys.all, "list"] as const,
    list: () => [...notificationKeys.lists()] as const,
    unreadCount: () => [...notificationKeys.all, "unreadCount"] as const,
    preferences: () => [...notificationKeys.all, "preferences"] as const,
}
