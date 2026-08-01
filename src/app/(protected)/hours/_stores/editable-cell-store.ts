import { create } from "zustand"

interface EditableCellState {
    activeCellKey: string | null
    showPicker: boolean
    selectedHours: number
    selectedMinutes: number
    isLoading: boolean
    error: string | null
}

interface EditableCellActions {
    openPicker: (cellKey: string, currentHours: number) => void
    closePicker: () => void
    setActiveCellKey: (cellKey: string | null) => void
    setSelectedHours: (hours: number) => void
    setSelectedMinutes: (minutes: number) => void
    setLoading: (isLoading: boolean) => void
    setError: (error: string | null) => void
    reset: () => void
}

export const useEditableCellStore = create<EditableCellState & EditableCellActions>((set) => ({
    activeCellKey: null,
    showPicker: false,
    selectedHours: 0,
    selectedMinutes: 0,
    isLoading: false,
    error: null,
    openPicker: (cellKey, currentHours) => {
        const hours = Math.floor(currentHours)
        const minutes = Math.round((currentHours - hours) * 60)
        set({
            activeCellKey: cellKey,
            showPicker: true,
            selectedHours: hours,
            selectedMinutes: minutes,
            error: null,
        })
    },
    closePicker: () =>
        set({
            activeCellKey: null,
            showPicker: false,
            error: null,
        }),
    setActiveCellKey: (cellKey) => set({ activeCellKey: cellKey }),
    setSelectedHours: (hours) => set({ selectedHours: hours }),
    setSelectedMinutes: (minutes) => set({ selectedMinutes: minutes }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    reset: () =>
        set({
            activeCellKey: null,
            showPicker: false,
            selectedHours: 0,
            selectedMinutes: 0,
            isLoading: false,
            error: null,
        }),
}))
