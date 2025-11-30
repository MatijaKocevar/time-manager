"use client"

import { useEffect } from "react"
import { useBreadcrumbStore } from "./breadcrumb-store"

export function SetBreadcrumbData({ data }: { data: Record<string, string> }) {
    const setOverrides = useBreadcrumbStore((state) => state.setOverrides)
    const clearOverrides = useBreadcrumbStore((state) => state.clearOverrides)

    useEffect(() => {
        setOverrides(data)

        return () => {
            clearOverrides()
        }
    }, [data, setOverrides, clearOverrides])

    return null
}
