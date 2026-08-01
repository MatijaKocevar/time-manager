import { useQuery } from "@tanstack/react-query"

export function useHolidays(
    startDate: string,
    endDate: string,
    initialHolidays: Array<{ date: Date; name: string }>
) {
    const { data: holidays = initialHolidays } = useQuery({
        queryKey: ["holidays", startDate, endDate],
        queryFn: async () => {
            const { getHolidaysInRange } =
                await import("../../admin/holidays/_actions/holiday-actions")
            return getHolidaysInRange(startDate, endDate)
        },
        staleTime: 300000,
    })

    return holidays
}
