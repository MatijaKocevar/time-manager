"use client"

import { useEffect, useRef } from "react"
import { useThemeStore } from "../stores/theme-store"
import { updateThemePreference } from "../actions/theme-actions"

export function ThemeProvider({
    children,
    initialTheme,
    isAuthenticated = false,
}: {
    children: React.ReactNode
    initialTheme: "light" | "dark"
    isAuthenticated?: boolean
}) {
    const theme = useThemeStore((state) => state.theme)
    const setTheme = useThemeStore((state) => state.setTheme)
    const hasHydrated = useThemeStore((state) => state.hasHydrated)
    const isInitialMount = useRef(true)
    const hasSyncedWithServer = useRef(false)

    useEffect(() => {
        if (!hasSyncedWithServer.current && isAuthenticated) {
            setTheme(initialTheme)
            hasSyncedWithServer.current = true
        } else if (!hasSyncedWithServer.current && !isAuthenticated && hasHydrated) {
            if (theme === "light") {
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
                if (prefersDark) {
                    setTheme("dark")
                }
            }
            hasSyncedWithServer.current = true
        }
    }, [initialTheme, setTheme, isAuthenticated, hasHydrated, theme])

    useEffect(() => {
        const root = document.documentElement
        if (theme === "dark") {
            root.classList.add("dark")
        } else {
            root.classList.remove("dark")
        }

        if (!isInitialMount.current) {
            const color = theme === "dark" ? "#000000" : "#ffffff"

            const metaColorDark = document.querySelector(
                'meta[name="theme-color"][media="(prefers-color-scheme: dark)"]'
            )
            const metaColorLight = document.querySelector(
                'meta[name="theme-color"][media="(prefers-color-scheme: light)"]'
            )

            if (metaColorDark) metaColorDark.setAttribute("content", color)
            if (metaColorLight) metaColorLight.setAttribute("content", color)

            void updateThemePreference(theme)
        } else {
            isInitialMount.current = false
        }
    }, [theme])

    return <>{children}</>
}
