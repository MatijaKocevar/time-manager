import { getServerSession } from "next-auth"
import { getTranslations } from "next-intl/server"
import { authConfig } from "@/lib/auth"
import { UsersTableWrapper } from "./components/users-table"
import { getUsers } from "./actions/user-actions"
import { SetBreadcrumbData } from "@/features/breadcrumbs/set-breadcrumb-data"

export default async function AdminUsersPage() {
    const session = await getServerSession(authConfig)
    const t = await getTranslations("navigation")
    const users = await getUsers()

    return (
        <>
            <SetBreadcrumbData data={{ "/admin/users": t("userManagement") }} />
            <div className="flex flex-col gap-4 min-w-0 h-full">
                <UsersTableWrapper users={users} currentUserId={session!.user.id} />
            </div>
        </>
    )
}
