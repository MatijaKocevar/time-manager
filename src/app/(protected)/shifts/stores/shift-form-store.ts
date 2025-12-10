import { create } from "zustand"
import type { ShiftLocation } from "../schemas/shift-schemas"
import { SHIFT_LOCATION } from "../constants"

interface ShiftFormState {
    location: ShiftLocation
    notes: string
    isLoading: boolean
    error: string
}

interface ShiftFormActions {
    setLocation: (location: ShiftLocation) => void
    setNotes: (notes: string) => void
    setIsLoading: (isLoading: boolean) => void
    setError: (error: string) => void
    resetForm: (location?: ShiftLocation, notes?: string) => void
}

export const useShiftFormStore = create<ShiftFormState & ShiftFormActions>((set) => ({
    location: SHIFT_LOCATION.OFFICE,
    notes: "",
    isLoading: false,
    error: "",

    setLocation: (location) => set({ location }),

    setNotes: (notes) => set({ notes }),

    setIsLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    resetForm: (location = SHIFT_LOCATION.OFFICE, notes = "") =>
        set({
            location,
            notes,
            isLoading: false,
            error: "",
        }),
}))
