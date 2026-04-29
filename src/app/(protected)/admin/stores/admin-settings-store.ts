import { create } from "zustand"

interface AdminSettingsState {
    isLoading: boolean
    error: string | null
}

interface AdminSettingsActions {
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
}

export const useAdminSettingsStore = create<AdminSettingsState & AdminSettingsActions>((set) => ({
    isLoading: false,
    error: null,
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
}))
