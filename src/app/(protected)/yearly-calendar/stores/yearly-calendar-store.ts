import { create } from "zustand"

interface DayEntriesDialogState {
    isOpen: boolean
    date: string | null
    type: string | null
}

interface YearlyCalendarState {
    selectedYear: number
    isLoading: boolean
    error: string | null
    dayEntriesDialog: DayEntriesDialogState
}

interface YearlyCalendarActions {
    setSelectedYear: (year: number) => void
    goToPreviousYear: () => void
    goToNextYear: () => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    openDayEntriesDialog: (date: string, type?: string) => void
    closeDayEntriesDialog: () => void
}

export const useYearlyCalendarStore = create<YearlyCalendarState & YearlyCalendarActions>(
    (set) => ({
        selectedYear: new Date().getFullYear(),
        isLoading: false,
        error: null,
        dayEntriesDialog: {
            isOpen: false,
            date: null,
            type: null,
        },
        setSelectedYear: (year) => set({ selectedYear: year }),
        goToPreviousYear: () => set((state) => ({ selectedYear: state.selectedYear - 1 })),
        goToNextYear: () => set((state) => ({ selectedYear: state.selectedYear + 1 })),
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        openDayEntriesDialog: (date, type) =>
            set({
                dayEntriesDialog: {
                    isOpen: true,
                    date,
                    type: type || null,
                },
            }),
        closeDayEntriesDialog: () =>
            set({
                dayEntriesDialog: {
                    isOpen: false,
                    date: null,
                    type: null,
                },
            }),
    })
)
