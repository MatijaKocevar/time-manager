"use client"

import { useEffect, useRef } from "react"
import { useThemeStore } from "@/stores/theme-store"
import { updateThemePreference } from "@/app/(protected)/actions/theme-actions"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useThemeStore((state) => state.theme)
    const isInitialMount = useRef(true)

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
