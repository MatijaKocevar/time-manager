import { useQuery } from "@tanstack/react-query"
import { getHourEntries } from "../actions/hour-actions"
import { getDateRange } from "../utils/view-helpers"
import { hourKeys } from "../query-keys"
import type { ViewMode } from "../schemas/hour-filter-schemas"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import { VIEW_MODE_VALUES } from "../schemas/hour-filter-schemas"

export function useHoursData(
    viewMode: ViewMode,
    currentDate: Date,
    initialEntries: HourEntryDisplay[],
    initialWeeklyEntries: HourEntryDisplay[],
    initialMonthlyEntries: HourEntryDisplay[]
) {
    const dateRange = getDateRange(viewMode, currentDate)
    const weekRange = getDateRange(VIEW_MODE_VALUES.WEEKLY, currentDate)
    const monthRange = getDateRange(VIEW_MODE_VALUES.MONTHLY, currentDate)

    const { data: entries = [], isLoading } = useQuery({
        queryKey: hourKeys.list({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
        queryFn: () => getHourEntries(dateRange.startDate, dateRange.endDate),
        placeholderData: initialEntries,
        staleTime: 300000,
    })

    const { data: fetchedWeeklyEntries = [] } = useQuery({
        queryKey: hourKeys.list({ startDate: weekRange.startDate, endDate: weekRange.endDate }),
        queryFn: () => getHourEntries(weekRange.startDate, weekRange.endDate),
        placeholderData: initialWeeklyEntries,
        staleTime: 300000,
        enabled: viewMode !== VIEW_MODE_VALUES.WEEKLY,
    })

    const weeklyEntries = viewMode === VIEW_MODE_VALUES.WEEKLY ? entries : fetchedWeeklyEntries

    const { data: monthlyEntries = [] } = useQuery({
        queryKey: hourKeys.list({ startDate: monthRange.startDate, endDate: monthRange.endDate }),
        queryFn: () => getHourEntries(monthRange.startDate, monthRange.endDate),
        placeholderData: initialMonthlyEntries,
        staleTime: 300000,
    })

    return {
        entries,
        isLoading,
        weeklyEntries,
        monthlyEntries,
        dateRange,
        weekRange,
        monthRange,
    }
}
