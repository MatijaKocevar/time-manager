import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ThemeState {
    theme: "light" | "dark"
    hasHydrated: boolean
}

interface ThemeActions {
    setTheme: (theme: "light" | "dark") => void
    toggleTheme: () => void
    setHasHydrated: (hasHydrated: boolean) => void
}

export const useThemeStore = create<ThemeState & ThemeActions>()(
    persist(
        (set) => ({
            theme: "light",
            hasHydrated: false,
            setTheme: (theme) => set({ theme }),
            toggleTheme: () =>
                set((state) => ({
                    theme: state.theme === "light" ? "dark" : "light",
                })),
            setHasHydrated: (hasHydrated) => set({ hasHydrated }),
        }),
        {
            name: "theme-storage",
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true)
            },
        }
    )
)
