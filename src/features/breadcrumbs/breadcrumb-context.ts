import { cache } from "react"

interface BreadcrumbItem {
    label: string
    href?: string
}

let breadcrumbsStore: BreadcrumbItem[] = []

export const setBreadcrumbs = (items: BreadcrumbItem[]) => {
    breadcrumbsStore = items
}

export const getBreadcrumbs = cache(() => {
    return breadcrumbsStore
})

export const clearBreadcrumbs = () => {
    breadcrumbsStore = []
}
