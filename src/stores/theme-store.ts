import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ThemeState {
    theme: "light" | "dark"
}

interface ThemeActions {
    setTheme: (theme: "light" | "dark") => void
    toggleTheme: () => void
}

export const useThemeStore = create<ThemeState & ThemeActions>()(
    persist(
        (set) => ({
            theme: "light",
            setTheme: (theme) => set({ theme }),
            toggleTheme: () =>
                set((state) => ({
                    theme: state.theme === "light" ? "dark" : "light",
                })),
        }),
        {
            name: "theme-storage",
        }
    )
)
