"use client"

import { useEffect, useLayoutEffect } from "react"
import { useBreadcrumbStore } from "./breadcrumb-store"

// Use useLayoutEffect to set breadcrumbs synchronously before paint
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

export function SetBreadcrumbData({ data }: { data: Record<string, string> }) {
    const setOverrides = useBreadcrumbStore((state) => state.setOverrides)
    const clearOverrides = useBreadcrumbStore((state) => state.clearOverrides)

    useIsomorphicLayoutEffect(() => {
        setOverrides(data)

        return () => {
            clearOverrides()
        }
    }, [data, setOverrides, clearOverrides])

    return null
}
