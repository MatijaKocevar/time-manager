import { create } from "zustand"
import type { UrnikNetRequestType } from "../schemas/create-urnik-net-request-schema"

interface CreateRequestStoreState {
    isDialogOpen: boolean
    isSubmitting: boolean
    error: string | null
    successMessage: string | null
    selectedType: UrnikNetRequestType | null
}

interface CreateRequestStoreActions {
    openDialog: () => void
    closeDialog: () => void
    setSubmitting: (isSubmitting: boolean) => void
    setError: (error: string | null) => void
    setSuccess: (message: string | null) => void
    setSelectedType: (type: UrnikNetRequestType | null) => void
    reset: () => void
}

const initialState: CreateRequestStoreState = {
    isDialogOpen: false,
    isSubmitting: false,
    error: null,
    successMessage: null,
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
        reset: () => set(initialState),
    })
)
