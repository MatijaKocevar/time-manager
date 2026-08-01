"use client"

import { useEffect } from "react"
import { useBreadcrumbContext } from "./breadcrumb-context"

export function SetBreadcrumb({ path, label }: { path: string; label: string }) {
    const { setOverrides } = useBreadcrumbContext()

    useEffect(() => {
        setOverrides({ [path]: label })
    }, [path, label, setOverrides])

    return null
}
