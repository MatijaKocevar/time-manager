export const trackerKeys = {
    all: ["tracker"] as const,
    dailySummary: () => [...trackerKeys.all, "dailySummary"] as const,
    taskEntryCounts: () => [...trackerKeys.all, "taskEntryCount"] as const,
    taskEntryCount: (taskId: string) => [...trackerKeys.taskEntryCounts(), taskId] as const,
}
