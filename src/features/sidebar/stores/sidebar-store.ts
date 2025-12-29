import { create } from "zustand"

interface SidebarState {
    expandedItems: Set<string>
}

interface SidebarActions {
    setExpandedItems: (items: string[]) => void
    toggleItem: (itemUrl: string) => void
    isExpanded: (itemUrl: string) => boolean
}

export const useSidebarStore = create<SidebarState & SidebarActions>((set, get) => ({
    expandedItems: new Set<string>(),

    setExpandedItems: (items: string[]) => {
        set({ expandedItems: new Set(items) })
    },

    toggleItem: (itemUrl: string) => {
        set((state) => {
            const newExpanded = new Set(state.expandedItems)
            if (newExpanded.has(itemUrl)) {
                newExpanded.delete(itemUrl)
            } else {
                newExpanded.add(itemUrl)
            }
            return { expandedItems: newExpanded }
        })
    },

    isExpanded: (itemUrl: string) => {
        return get().expandedItems.has(itemUrl)
    },
}))
