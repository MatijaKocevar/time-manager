import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function TasksPage() {
    const session = await getServerSession(authConfig)

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                <p className="text-muted-foreground">Create and manage your tasks</p>
            </div>
        </div>
    )
}
