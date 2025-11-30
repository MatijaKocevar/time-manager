"use client"

import { useEffect } from "react"
import { useBreadcrumbStore } from "./breadcrumb-store"

interface BreadcrumbItem {
    label: string
    href?: string
}

interface SetBreadcrumbsProps {
    items: BreadcrumbItem[]
}

export function SetBreadcrumbs({ items }: SetBreadcrumbsProps) {
    const setItems = useBreadcrumbStore((state) => state.setItems)

    useEffect(() => {
        setItems(items)
    }, [items, setItems])

    return null
}
