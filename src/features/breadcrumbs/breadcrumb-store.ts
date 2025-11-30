import { create } from "zustand"

interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbStore {
    items: BreadcrumbItem[]
    setItems: (items: BreadcrumbItem[]) => void
}

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
    items: [],
    setItems: (items) => set({ items }),
}))
