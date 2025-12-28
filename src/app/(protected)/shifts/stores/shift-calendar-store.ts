import { create } from "zustand"

type ViewMode = "week" | "month"

interface ShiftCalendarState {
    viewMode: ViewMode
    currentDate: Date
}

interface ShiftCalendarActions {
    setViewMode: (mode: ViewMode) => void
    setCurrentDate: (date: Date) => void
    handlePrevious: () => void
    handleNext: () => void
    handleToday: () => void
}

export const useShiftCalendarStore = create<ShiftCalendarState & ShiftCalendarActions>(
    (set, get) => ({
        viewMode: "week",
        currentDate: new Date(),

        setViewMode: (mode) => set({ viewMode: mode }),

        setCurrentDate: (date) => set({ currentDate: date }),

        handlePrevious: () => {
            const { currentDate, viewMode } = get()
            const newDate = new Date(currentDate)
            if (viewMode === "week") {
                newDate.setDate(currentDate.getDate() - 7)
            } else {
                newDate.setMonth(currentDate.getMonth() - 1)
            }
            set({ currentDate: newDate })
        },

        handleNext: () => {
            const { currentDate, viewMode } = get()
            const newDate = new Date(currentDate)
            if (viewMode === "week") {
                newDate.setDate(currentDate.getDate() + 7)
            } else {
                newDate.setMonth(currentDate.getMonth() + 1)
            }
            set({ currentDate: newDate })
        },

        handleToday: () => set({ currentDate: new Date() }),
    })
)
