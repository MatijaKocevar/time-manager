"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import {
    getYearlyCalendarData,
    getYearlyBalance,
    DayData,
} from "../_actions/yearly-calendar-actions"
import { yearlyCalendarKeys } from "../query-keys"
import { useYearlyCalendarStore } from "../_stores/yearly-calendar-store"
import { YearlyCalendarHeader } from "./yearly-calendar-header"
import { YearlyCalendarTable } from "./yearly-calendar-table"
import { DayEntriesDialog } from "@/app/(protected)/time-sheets/_components/day-entries-dialog"

interface YearlyCalendarClientProps {
    initialYear: number
    initialData: Record<string, DayData>
    yearlyBalance: number
    initialHolidays: Array<{ date: Date; name: string }>
    translations: {
        header: {
            title: string
            year: string
        }
        months: string[]
        dayEntriesDialog: {
            title: string
            description: string
            startedAt: string
            endedAt: string
            duration: string
            task: string
            active: string
            noEntries: string
            close: string
        }
    }
}

export function YearlyCalendarClient({
    initialYear,
    initialData,
    yearlyBalance,
    initialHolidays,
    translations,
}: YearlyCalendarClientProps) {
    const selectedYear = useYearlyCalendarStore((state) => state.selectedYear)
    const setSelectedYear = useYearlyCalendarStore((state) => state.setSelectedYear)

    useEffect(() => {
        setSelectedYear(initialYear)
    }, [initialYear, setSelectedYear])

    const { data: yearData } = useQuery({
        queryKey: yearlyCalendarKeys.year(selectedYear),
        queryFn: async () => {
            const result = await getYearlyCalendarData({ year: selectedYear })
            if (result.error) {
                throw new Error(result.error)
            }
            return result.data!
        },
        initialData: selectedYear === initialYear ? initialData : undefined,
        staleTime: 1000 * 60 * 5,
    })

    const { data: balance } = useQuery({
        queryKey: yearlyCalendarKeys.balance(selectedYear),
        queryFn: async () => {
            const result = await getYearlyBalance({ year: selectedYear })
            if (result.error) {
                throw new Error(result.error)
            }
            return result.data!
        },
        initialData: selectedYear === initialYear ? yearlyBalance : undefined,
        staleTime: 1000 * 60 * 5,
    })

    return (
        <div className="flex flex-col gap-4 h-full">
            <YearlyCalendarHeader
                translations={translations.header}
                yearlyBalance={balance ?? yearlyBalance}
            />
            <div className="flex-1 min-h-0">
                <YearlyCalendarTable
                    year={selectedYear}
                    data={yearData || {}}
                    initialHolidays={initialHolidays}
                    translations={translations}
                />
            </div>
            <DayEntriesDialog translations={translations.dayEntriesDialog} />
        </div>
    )
}
