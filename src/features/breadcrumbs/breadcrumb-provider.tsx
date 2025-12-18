"use client"

import { createContext, useContext } from "react"

const BreadcrumbContext = createContext<Record<string, string>>({})

export function BreadcrumbProvider({
    children,
    translations,
}: {
    children: React.ReactNode
    translations: Record<string, string>
}) {
    return <BreadcrumbContext.Provider value={translations}>{children}</BreadcrumbContext.Provider>
}

export function useBreadcrumbTranslations() {
    return useContext(BreadcrumbContext)
}
