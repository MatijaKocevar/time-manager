export const hourKeys = {
    all: ["hours"] as const,
    lists: () => [...hourKeys.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...hourKeys.lists(), filters] as const,
    monthly: () => [...hourKeys.all, "monthly"] as const,
    monthlySummary: (date: string) => [...hourKeys.monthly(), date] as const,
}
