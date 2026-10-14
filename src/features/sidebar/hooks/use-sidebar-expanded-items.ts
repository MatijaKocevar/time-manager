"use client"

import { useEffect, useLayoutEffect, useState } from "react"

const SIDEBAR_EXPANDED_ITEMS_KEY = "sidebar-expanded-items"

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

function readExpandedItems(): string[] {
    try {
        const stored = localStorage.getItem(SIDEBAR_EXPANDED_ITEMS_KEY)
        if (!stored) return []

        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []
    } catch {
        return []
    }
}

function writeExpandedItems(items: Set<string>) {
    try {
        localStorage.setItem(SIDEBAR_EXPANDED_ITEMS_KEY, JSON.stringify(Array.from(items)))
    } catch {
        return
    }
}

export function useSidebarExpandedItems() {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(() => new Set<string>())

    useBrowserLayoutEffect(() => {
        const stored = readExpandedItems()
        if (stored.length > 0) {
            setExpandedItems(new Set(stored))
        }
    }, [])

    function toggleItem(itemUrl: string) {
        const next = new Set(expandedItems)
        if (next.has(itemUrl)) {
            next.delete(itemUrl)
        } else {
            next.add(itemUrl)
        }
        setExpandedItems(next)
        writeExpandedItems(next)
    }

    function isExpanded(itemUrl: string) {
        return expandedItems.has(itemUrl)
    }

    return { expandedItems, toggleItem, isExpanded }
}
