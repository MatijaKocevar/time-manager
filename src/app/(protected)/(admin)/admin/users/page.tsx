import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { UsersTableWrapper } from "./components/users-table"
import { getUsers } from "./actions/user-actions"

export default async function AdminUsersPage() {
    const session = await getServerSession(authConfig)
    const users = await getUsers()

    return (
        <div className="flex flex-col gap-4 min-w-0 h-full">
            <UsersTableWrapper users={users} currentUserId={session!.user.id} />
        </div>
    )
}
