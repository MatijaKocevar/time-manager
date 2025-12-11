export const taskKeys = {
    all: ["tasks"] as const,
    lists: () => [...taskKeys.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...taskKeys.lists(), filters] as const,
    byList: (listId: string | null) => [...taskKeys.lists(), { listId }] as const,
    tree: () => [...taskKeys.all, "tree"] as const,
    timeEntries: () => [...taskKeys.all, "timeEntries"] as const,
    timeEntriesForTask: (taskId: string) => [...taskKeys.timeEntries(), taskId] as const,
    activeTimer: () => [...taskKeys.all, "activeTimer"] as const,
}

export const listKeys = {
    all: ["lists"] as const,
    lists: () => [...listKeys.all, "list"] as const,
    detail: (id: string) => [...listKeys.all, "detail", id] as const,
}
