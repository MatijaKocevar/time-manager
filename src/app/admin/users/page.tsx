import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UsersTable } from "./components/users-table"
import { CreateUserDialog } from "./components/create-user-dialog"
import { SetBreadcrumbs } from "@/features/breadcrumbs"
import { getUsers } from "./actions/user-actions"

export default async function AdminUsersPage() {
    const session = await getServerSession(authConfig)

    if (!session) {
        redirect("/login")
    }

    if (session.user.role !== "ADMIN") {
        redirect("/")
    }

    const users = await getUsers()

    return (
        <>
            <SetBreadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Users" }]} />
            <div className="flex flex-col gap-6 min-w-0">
                <div className="flex justify-end">
                    <CreateUserDialog />
                </div>
                <UsersTable users={users} currentUserId={session.user.id} />
            </div>
        </>
    )
}
