import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminUsersPage() {
    const session = await getServerSession(authConfig)

    if (!session) {
        redirect("/login")
    }

    if (session.user.role !== "ADMIN") {
        redirect("/")
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">View employee hours and export data</p>
            </div>
        </div>
    )
}
