import { create } from "zustand"

interface UserHoursSectionState {
    currentDate: Date
    isExportDialogOpen: boolean
}

interface UserHoursSectionActions {
    setCurrentDate: (date: Date) => void
    setIsExportDialogOpen: (open: boolean) => void
}

export const useUserHoursSectionStore = create<UserHoursSectionState & UserHoursSectionActions>(
    (set) => ({
        currentDate: new Date(),
        isExportDialogOpen: false,
        setCurrentDate: (currentDate) => set({ currentDate }),
        setIsExportDialogOpen: (isExportDialogOpen) => set({ isExportDialogOpen }),
    })
)
