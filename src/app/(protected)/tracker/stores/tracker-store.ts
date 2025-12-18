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
    initializeSelectedTask: (
        activeTaskId: string | undefined,
        currentSelectedId: string | null,
        tasks: Array<{ id: string }>
    ) => void
}

export const useTrackerStore = create<TrackerStoreState & TrackerStoreActions>((set) => ({
    selectedTaskId: null,
    isLoading: false,
    error: "",
    setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    resetError: () => set({ error: "" }),
    initializeSelectedTask: (activeTaskId, currentSelectedId, tasks) => {
        if (activeTaskId) {
            set({ selectedTaskId: activeTaskId })
        } else if (!currentSelectedId && tasks.length > 0) {
            set({ selectedTaskId: tasks[0].id })
        }
    },
}))
