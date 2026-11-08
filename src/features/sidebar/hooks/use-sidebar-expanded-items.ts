"use client"

import { useState } from "react"
import {
    SIDEBAR_EXPANDED_ITEMS_COOKIE,
    serializeExpandedItems,
} from "../lib/sidebar-expanded-items"

function writeExpandedItems(items: Set<string>) {
    document.cookie = `${SIDEBAR_EXPANDED_ITEMS_COOKIE}=${serializeExpandedItems(items)}; path=/; max-age=31536000; samesite=lax`
}

export function useSidebarExpandedItems(initialItems: string[] = []) {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(() => new Set(initialItems))

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
