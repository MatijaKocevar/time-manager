import { create } from "zustand"
import type { ViewMode } from "../utils/date-helpers"

interface TimeSheetsState {
    viewMode: ViewMode
    selectedDate: Date
    isLoading: boolean
    error: string | null
}

interface TimeSheetsActions {
    setViewMode: (mode: ViewMode) => void
    setSelectedDate: (date: Date) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    goToPreviousPeriod: () => void
    goToNextPeriod: () => void
}

export const useTimeSheetsStore = create<TimeSheetsState & TimeSheetsActions>((set, get) => ({
    viewMode: "week",
    selectedDate: new Date(),
    isLoading: false,
    error: null,

    setViewMode: (mode) => set({ viewMode: mode }),
    setSelectedDate: (date) => set({ selectedDate: date }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    goToPreviousPeriod: () => {
        const { selectedDate, viewMode } = get()
        const newDate = new Date(selectedDate)

        if (viewMode === "week") {
            newDate.setDate(newDate.getDate() - 7)
        } else {
            newDate.setMonth(newDate.getMonth() - 1)
        }

        set({ selectedDate: newDate })
    },

    goToNextPeriod: () => {
        const { selectedDate, viewMode } = get()
        const newDate = new Date(selectedDate)

        if (viewMode === "week") {
            newDate.setDate(newDate.getDate() + 7)
        } else {
            newDate.setMonth(newDate.getMonth() + 1)
        }

        set({ selectedDate: newDate })
    },
}))
