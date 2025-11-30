export const requestKeys = {
    all: ["requests"] as const,
    lists: () => [...requestKeys.all, "list"] as const,
    list: (filters: { status?: string; userId?: string }) =>
        [...requestKeys.lists(), filters] as const,
    userRequests: () => [...requestKeys.all, "user"] as const,
    adminRequests: () => [...requestKeys.all, "admin"] as const,
    detail: (id: string) => [...requestKeys.all, "detail", id] as const,
}
