import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UsersTable } from "./components/users-table"
import { CreateUserDialog } from "./components/create-user-dialog"

export default async function AdminUsersPage() {
    const session = await getServerSession(authConfig)

    if (!session) {
        redirect("/login")
    }

    if (session.user.role !== "ADMIN") {
        redirect("/")
    }

    const users = await prisma.user.findMany({
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage users and their permissions</p>
                </div>
                <CreateUserDialog />
            </div>
            <UsersTable users={users} currentUserId={session.user.id} />
        </div>
    )
}
