import { create } from "zustand"
import { type RequestType } from "../_schemas/request-schemas"

interface RequestFormState {
    type: RequestType | ""
    startDate: string
    endDate: string
    startTime: string
    endTime: string
    isFullDay: boolean
    requestedHours: number | null
    reason: string
    location: string
    skipWeekends: boolean
    skipHolidays: boolean
    sendToUrnikNet: boolean
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
        startTime: "09:00",
        endTime: "17:00",
        isFullDay: true,
        requestedHours: null,
        reason: "",
        location: "",
        skipWeekends: true,
        skipHolidays: true,
        sendToUrnikNet: false,
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
                startTime: "09:00",
                endTime: "17:00",
                isFullDay: true,
                requestedHours: null,
                reason: "",
                location: "",
                skipWeekends: true,
                skipHolidays: true,
                sendToUrnikNet: false,
            },
            error: null,
        }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}))
