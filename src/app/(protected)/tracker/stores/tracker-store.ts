import { create } from "zustand"

interface TrackerStoreState {
    selectedTaskId: string | null
    isLoading: boolean
    error: string
}

interface TrackerStoreActions {
    setSelectedTaskId: (taskId: string | null) => void
    setIsLoading: (isLoading: boolean) => void
    setError: (error: string) => void
    resetError: () => void
}

export const useTrackerStore = create<TrackerStoreState & TrackerStoreActions>((set) => ({
    selectedTaskId: null,
    isLoading: false,
    error: "",
    setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    resetError: () => set({ error: "" }),
}))
