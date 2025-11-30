import { setBreadcrumbs } from "./breadcrumb-context"

interface BreadcrumbItem {
    label: string
    href?: string
}

interface SetBreadcrumbsProps {
    items: BreadcrumbItem[]
}

export function SetBreadcrumbs({ items }: SetBreadcrumbsProps) {
    setBreadcrumbs(items)
    return null
}
