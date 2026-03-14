import { create } from "zustand"
import type { UrnikNetRequestType } from "../schemas/create-urnik-net-request-schema"
import type { UrnikDayRequestType } from "../schemas/create-urnik-net-day-request-schema"

export type RequestCategory = "HOUR" | "DAY"

interface CreateRequestStoreState {
    isDialogOpen: boolean
    isSubmitting: boolean
    error: string | null
    successMessage: string | null
    requestCategory: RequestCategory | null
    selectedType: UrnikNetRequestType | UrnikDayRequestType | null
}

interface CreateRequestStoreActions {
    openDialog: () => void
    closeDialog: () => void
    setSubmitting: (isSubmitting: boolean) => void
    setError: (error: string | null) => void
    setSuccess: (message: string | null) => void
    setSelectedType: (type: UrnikNetRequestType | UrnikDayRequestType | null) => void
    setRequestCategory: (category: RequestCategory | null) => void
    reset: () => void
}

const initialState: CreateRequestStoreState = {
    isDialogOpen: false,
    isSubmitting: false,
    error: null,
    successMessage: null,
    requestCategory: null,
    selectedType: null,
}

export const useCreateRequestStore = create<CreateRequestStoreState & CreateRequestStoreActions>(
    (set) => ({
        ...initialState,

        openDialog: () => set({ isDialogOpen: true }),
        closeDialog: () => set(initialState),
        setSubmitting: (isSubmitting) => set({ isSubmitting }),
        setError: (error) => set({ error, successMessage: null }),
        setSuccess: (message) => set({ successMessage: message, error: null }),
        setSelectedType: (selectedType) => set({ selectedType }),
        setRequestCategory: (requestCategory) => set({ requestCategory }),
        reset: () => set(initialState),
    })
)
