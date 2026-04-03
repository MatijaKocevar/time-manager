import { create } from "zustand"
import type { ViewMode } from "../utils/date-helpers"

interface TimeSheetsState {
    viewMode: ViewMode
    selectedDate: Date
    isLoading: boolean
    error: string | null
    taskFilter: "work" | "private"
    dayEntriesDialog: {
        isOpen: boolean
        date: string | null
        type: string | null
    }
}

interface TimeSheetsActions {
    setViewMode: (mode: ViewMode) => void
    setSelectedDate: (date: Date) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    setTaskFilter: (filter: "work" | "private") => void
    goToPreviousPeriod: () => void
    goToNextPeriod: () => void
    openDayEntriesDialog: (date: string, type?: string) => void
    closeDayEntriesDialog: () => void
}

export const useTimeSheetsStore = create<TimeSheetsState & TimeSheetsActions>((set, get) => ({
    viewMode: "week",
    selectedDate: new Date(),
    isLoading: false,
    error: null,
    taskFilter: "work",
    dayEntriesDialog: {
        isOpen: false,
        date: null,
        type: null,
    },

    setViewMode: (mode) => set({ viewMode: mode }),
    setSelectedDate: (date) => set({ selectedDate: date }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setTaskFilter: (filter) => set({ taskFilter: filter }),

    openDayEntriesDialog: (date, type) =>
        set({
            dayEntriesDialog: {
                isOpen: true,
                date,
                type: type ?? null,
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
