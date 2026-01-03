import { ReactNode } from "react"
import { getListById } from "../actions/list-actions"
import { SetBreadcrumb } from "@/features/breadcrumbs"

interface ListLayoutProps {
    children: ReactNode
    params: Promise<{ listId: string }>
}

export default async function ListLayout({ children, params }: ListLayoutProps) {
    const { listId } = await params
    const actualListId = listId === "no-list" ? null : listId

    const list = actualListId ? await getListById(actualListId) : null
    const breadcrumbLabel = listId === "no-list" ? "No List" : list?.name || "List"

    return (
        <>
            <SetBreadcrumb path={`/tasks/${listId}`} label={breadcrumbLabel} />
            {children}
        </>
    )
}
