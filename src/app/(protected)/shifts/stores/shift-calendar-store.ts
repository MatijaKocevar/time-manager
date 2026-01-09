import { create } from "zustand"
import type { UserWithWorkHours, ShiftDisplay } from "../schemas/shift-schemas"

type ViewMode = "week" | "month"

interface ShiftCalendarState {
    viewMode: ViewMode
    currentDate: Date
    isRequestDialogOpen: boolean
    selectedDayShifts: {
        date: Date
        user: UserWithWorkHours
        shifts: ShiftDisplay[]
    } | null
}

interface ShiftCalendarActions {
    setViewMode: (mode: ViewMode) => void
    setCurrentDate: (date: Date) => void
    handlePrevious: () => void
    handleNext: () => void
    handleToday: () => void
    openRequestDialog: () => void
    closeRequestDialog: () => void
    setShiftDetails: (date: Date, user: UserWithWorkHours, shifts: ShiftDisplay[]) => void
    clearShiftDetails: () => void
}

export const useShiftCalendarStore = create<ShiftCalendarState & ShiftCalendarActions>(
    (set, get) => ({
        viewMode: "week",
        currentDate: new Date(),
        isRequestDialogOpen: false,
        selectedDayShifts: null,

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

        openRequestDialog: () => set({ isRequestDialogOpen: true }),

        closeRequestDialog: () => set({ isRequestDialogOpen: false }),

        setShiftDetails: (date, user, shifts) => set({ selectedDayShifts: { date, user, shifts } }),

        clearShiftDetails: () => set({ selectedDayShifts: null }),
    })
)
