"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

interface BreadcrumbContextValue {
    overrides: Record<string, string>
    setOverrides: (data: Record<string, string>) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

export function BreadcrumbProvider({
    children,
    initialOverrides = {},
}: {
    children: ReactNode
    initialOverrides?: Record<string, string>
}) {
    const [overrides, setOverridesState] = useState<Record<string, string>>(initialOverrides)

    const setOverrides = useCallback((data: Record<string, string>) => {
        setOverridesState((prev) => ({ ...prev, ...data }))
    }, [])

    return (
        <BreadcrumbContext.Provider value={{ overrides, setOverrides }}>
            {children}
        </BreadcrumbContext.Provider>
    )
}

export function useBreadcrumbContext() {
    const context = useContext(BreadcrumbContext)
    if (!context) {
        throw new Error("useBreadcrumbContext must be used within BreadcrumbProvider")
    }
    return context
}
