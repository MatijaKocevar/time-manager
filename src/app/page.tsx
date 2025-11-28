import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
    const session = await getServerSession(authConfig)

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back, {session.user?.name || session.user?.email}
                </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Today&apos;s Tasks</h3>
                    <p className="text-2xl font-bold">0</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Time Tracked</h3>
                    <p className="text-2xl font-bold">0h 0m</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">Active Projects</h3>
                    <p className="text-2xl font-bold">0</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold">This Week</h3>
                    <p className="text-2xl font-bold">0h 0m</p>
                </div>
            </div>
        </div>
    )
}
