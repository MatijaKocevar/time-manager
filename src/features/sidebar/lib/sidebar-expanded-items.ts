export const SIDEBAR_EXPANDED_ITEMS_COOKIE = "sidebar_expanded_items"

export const DEFAULT_EXPANDED_ITEMS = ["/tasks"]

function parseArray(value: string): string[] | null {
    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === "string")
            : null
    } catch {
        return null
    }
}

export function parseExpandedItemsCookie(value: string | undefined): string[] {
    if (value === undefined) {
        return DEFAULT_EXPANDED_ITEMS
    }

    const raw = parseArray(value)

    if (raw) {
        return raw
    }

    try {
        return parseArray(decodeURIComponent(value)) ?? DEFAULT_EXPANDED_ITEMS
    } catch {
        return DEFAULT_EXPANDED_ITEMS
    }
}

export function serializeExpandedItems(items: Set<string>): string {
    return encodeURIComponent(JSON.stringify(Array.from(items)))
}
