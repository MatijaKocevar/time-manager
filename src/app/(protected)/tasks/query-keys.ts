export const taskKeys = {
    all: ["tasks"] as const,
    lists: () => [...taskKeys.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...taskKeys.lists(), filters] as const,
    tree: () => [...taskKeys.all, "tree"] as const,
    timeEntries: () => [...taskKeys.all, "timeEntries"] as const,
    timeEntriesForTask: (taskId: string) => [...taskKeys.timeEntries(), taskId] as const,
    activeTimer: () => [...taskKeys.all, "activeTimer"] as const,
}
