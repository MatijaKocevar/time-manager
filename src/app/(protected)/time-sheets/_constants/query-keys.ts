export const timeSheetKeys = {
    all: ["timeSheets"] as const,
    lists: () => [...timeSheetKeys.all, "list"] as const,
    list: (filters: { startDate: string; endDate: string }) =>
        [...timeSheetKeys.lists(), filters] as const,
    dayEntries: () => [...timeSheetKeys.all, "dayEntries"] as const,
    dayEntry: (filters: { date: string; type?: string }) =>
        [...timeSheetKeys.dayEntries(), filters] as const,
}
