import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function TrackerPage() {
    const session = await getServerSession(authConfig)

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Time Tracker</h1>
                <p className="text-muted-foreground">Track time on tasks</p>
            </div>
        </div>
    )
}
