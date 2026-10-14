import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "light" | "dark"

interface ThemeState {
    theme: Theme
}

interface ThemeActions {
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
}

function getPreferredTheme(): Theme {
    if (typeof window === "undefined") {
        return "light"
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export const useThemeStore = create<ThemeState & ThemeActions>()(
    persist(
        (set) => ({
            theme: getPreferredTheme(),
            setTheme: (theme) => set({ theme }),
            toggleTheme: () =>
                set((state) => ({
                    theme: state.theme === "light" ? "dark" : "light",
                })),
        }),
        {
            name: "theme-storage",
            partialize: (state) => ({ theme: state.theme }),
        }
    )
)
