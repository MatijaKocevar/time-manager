export const holidayKeys = {
    all: ["holidays"] as const,
    lists: () => [...holidayKeys.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...holidayKeys.lists(), filters] as const,
    details: () => [...holidayKeys.all, "detail"] as const,
    detail: (id: string) => [...holidayKeys.details(), id] as const,
}
