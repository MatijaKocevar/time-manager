import { create } from "zustand"

interface AdminSettingsState {
    isLoading: boolean
    error: string | null
    selectedUserIds: string[]
    autoAdmin: boolean
}

interface AdminSettingsActions {
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    setSelectedUserIds: (ids: string[]) => void
    setAutoAdmin: (enabled: boolean) => void
}

export const useAdminSettingsStore = create<AdminSettingsState & AdminSettingsActions>((set) => ({
    isLoading: false,
    error: null,
    selectedUserIds: [],
    autoAdmin: false,
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setSelectedUserIds: (ids) => set({ selectedUserIds: ids }),
    setAutoAdmin: (enabled) => set({ autoAdmin: enabled }),
}))
