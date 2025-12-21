export const timeSheetKeys = {
    all: ["timeSheets"] as const,
    lists: () => [...timeSheetKeys.all, "list"] as const,
    list: (filters: { startDate: string; endDate: string }) =>
        [...timeSheetKeys.lists(), filters] as const,
}
