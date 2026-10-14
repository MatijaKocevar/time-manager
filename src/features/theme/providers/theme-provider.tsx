"use client"

import { useEffect } from "react"
import { useThemeStore } from "../stores/theme-store"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useThemeStore((state) => state.theme)

    useEffect(() => {
        const root = document.documentElement
        root.classList.toggle("dark", theme === "dark")

        const meta = document.querySelector('meta[name="theme-color"]')
        if (meta) {
            meta.setAttribute("content", theme === "dark" ? "#000000" : "#ffffff")
        }
    }, [theme])

    return <>{children}</>
}
