import { ReactNode } from "react"
import { getUserById } from "../actions/user-actions"
import { SetBreadcrumb } from "@/features/breadcrumbs"

interface UserLayoutProps {
    children: ReactNode
    params: Promise<{ id: string }>
}

export default async function UserLayout({ children, params }: UserLayoutProps) {
    const { id } = await params
    const user = await getUserById(id)

    return (
        <>
            <SetBreadcrumb path={`/admin/users/${id}`} label={user.name || "User"} />
            {children}
        </>
    )
}
