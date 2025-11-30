import Link from "next/link"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UsersTable } from "./components/users-table"
import { SetBreadcrumbs } from "@/features/breadcrumbs"
import { getUsers } from "./actions/user-actions"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

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
                    <Button asChild>
                        <Link href="/admin/users/create">
                            <Plus className="h-4 w-4 mr-2" />
                            Create User
                        </Link>
                    </Button>
                </div>
                <UsersTable users={users} currentUserId={session.user.id} />
            </div>
        </>
    )
}
