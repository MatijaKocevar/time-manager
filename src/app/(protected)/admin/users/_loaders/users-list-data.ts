import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { getUsers } from "../_actions/user-actions"
import type { UserTableItem } from "../_schemas/user-table-schemas"

interface UsersListData {
    users: UserTableItem[]
    currentUserId: string
}

export async function loadUsersListData(): Promise<UsersListData> {
    const [users, session] = await Promise.all([getUsers(true), getServerSession(authConfig)])

    return {
        users,
        currentUserId: session!.user.id,
    }
}
