import { create } from "zustand"
import type { ApiTokenDisplay } from "../_schemas/api-token-schemas"

interface ApiTokenStoreState {
    tokens: ApiTokenDisplay[]
    isDialogOpen: boolean
    name: string
    expiresInDays: number | null
    isSubmitting: boolean
    createdToken: string | null
    error: string | null
}

interface ApiTokenStoreActions {
    setTokens: (tokens: ApiTokenDisplay[]) => void
    setDialogOpen: (isOpen: boolean) => void
    setName: (name: string) => void
    setExpiresInDays: (expiresInDays: number | null) => void
    setSubmitting: (isSubmitting: boolean) => void
    setCreatedToken: (createdToken: string | null) => void
    setError: (error: string | null) => void
    resetForm: () => void
}

export const useApiTokenStore = create<ApiTokenStoreState & ApiTokenStoreActions>((set) => ({
    tokens: [],
    isDialogOpen: false,
    name: "",
    expiresInDays: null,
    isSubmitting: false,
    createdToken: null,
    error: null,

    setTokens: (tokens) => set({ tokens }),
    setDialogOpen: (isDialogOpen) => set({ isDialogOpen }),
    setName: (name) => set({ name }),
    setExpiresInDays: (expiresInDays) => set({ expiresInDays }),
    setSubmitting: (isSubmitting) => set({ isSubmitting }),
    setCreatedToken: (createdToken) => set({ createdToken }),
    setError: (error) => set({ error }),
    resetForm: () => set({ name: "", expiresInDays: null, createdToken: null, error: null }),
}))
