import { create } from "zustand"
import { type RequestType } from "../schemas/request-schemas"

interface RequestFormState {
    type: RequestType | ""
    startDate: string
    endDate: string
    reason: string
    location: string
    skipWeekends: boolean
    skipHolidays: boolean
}

interface RequestStoreState {
    formData: RequestFormState
    isLoading: boolean
    error: string | null
}

interface RequestStoreActions {
    setFormData: (data: Partial<RequestFormState>) => void
    resetForm: () => void
    setLoading: (isLoading: boolean) => void
    setError: (error: string | null) => void
}

export const useRequestStore = create<RequestStoreState & RequestStoreActions>((set) => ({
    formData: {
        type: "",
        startDate: "",
        endDate: "",
        reason: "",
        location: "",
        skipWeekends: true,
        skipHolidays: true,
    },
    isLoading: false,
    error: null,
    setFormData: (data) =>
        set((state) => ({
            formData: { ...state.formData, ...data },
        })),
    resetForm: () =>
        set({
            formData: {
                type: "",
                startDate: "",
                endDate: "",
                reason: "",
                location: "",
                skipWeekends: true,
                skipHolidays: true,
            },
            error: null,
        }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}))
