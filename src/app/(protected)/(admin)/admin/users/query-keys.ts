export const userKeys = {
    all: ["users"] as const,
    lists: () => [...userKeys.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...userKeys.lists(), filters] as const,
    details: () => [...userKeys.all, "detail"] as const,
    detail: (id: string) => [...userKeys.details(), id] as const,
}

export const userHourKeys = {
    all: ["user-hours"] as const,
    byUser: (userId: string) => [...userHourKeys.all, userId] as const,
    detail: (userId: string, month: string) => [...userHourKeys.byUser(userId), month] as const,
}
