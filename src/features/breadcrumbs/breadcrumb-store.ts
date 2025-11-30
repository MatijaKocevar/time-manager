import { create } from "zustand"

type BreadcrumbData = Record<string, string>

interface BreadcrumbStore {
    overrides: BreadcrumbData
    setOverrides: (data: BreadcrumbData) => void
    clearOverrides: () => void
}

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
    overrides: {},
    setOverrides: (data) => set((state) => ({ overrides: { ...state.overrides, ...data } })),
    clearOverrides: () => set({ overrides: {} }),
}))
