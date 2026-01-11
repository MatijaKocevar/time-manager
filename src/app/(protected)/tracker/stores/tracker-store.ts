import { create } from "zustand"
import type { HourType } from "@/../../prisma/generated/client"

interface TrackerStoreState {
    selectedType: HourType
    selectedTaskId: string | null
    isLoading: boolean
    error: string
    lastViewedDate: string
}

interface TrackerStoreActions {
    setSelectedType: (type: HourType) => void
    setSelectedTaskId: (taskId: string | null) => void
    setIsLoading: (isLoading: boolean) => void
    setError: (error: string) => void
    resetError: () => void
    checkAndResetForNewDay: () => void
}

const getTodayDateString = () => {
    return new Date().toISOString().split("T")[0]
}

export const useTrackerStore = create<TrackerStoreState & TrackerStoreActions>((set, get) => ({
    selectedType: "WORK",
    selectedTaskId: null,
    isLoading: false,
    error: "",
    lastViewedDate: getTodayDateString(),
    setSelectedType: (type) => set({ selectedType: type, selectedTaskId: null }),
    setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    resetError: () => set({ error: "" }),
    checkAndResetForNewDay: () => {
        const today = getTodayDateString()
        const lastViewed = get().lastViewedDate

        if (today !== lastViewed) {
            set({
                lastViewedDate: today,
                selectedTaskId: null,
                error: "",
            })
        }
    },
}))
