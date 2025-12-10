import { create } from "zustand"
import type { ShiftLocation } from "../schemas/shift-schemas"

type ViewMode = "week" | "month"

interface ShiftCalendarState {
    viewMode: ViewMode
    currentDate: Date
    editDialog: {
        isOpen: boolean
        date: Date
        userId?: string
        userName?: string
        currentLocation?: ShiftLocation
        currentNotes?: string
    }
}

interface ShiftCalendarActions {
    setViewMode: (mode: ViewMode) => void
    setCurrentDate: (date: Date) => void
    openEditDialog: (params: {
        date: Date
        userId?: string
        userName?: string
        currentLocation?: ShiftLocation
        currentNotes?: string
    }) => void
    closeEditDialog: () => void
    handlePrevious: () => void
    handleNext: () => void
    handleToday: () => void
}

export const useShiftCalendarStore = create<ShiftCalendarState & ShiftCalendarActions>(
    (set, get) => ({
        viewMode: "week",
        currentDate: new Date(),
        editDialog: {
            isOpen: false,
            date: new Date(),
        },

        setViewMode: (mode) => set({ viewMode: mode }),

        setCurrentDate: (date) => set({ currentDate: date }),

        openEditDialog: (params) =>
            set({
                editDialog: {
                    isOpen: true,
                    ...params,
                },
            }),

        closeEditDialog: () =>
            set((state) => ({
                editDialog: {
                    ...state.editDialog,
                    isOpen: false,
                },
            })),

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
