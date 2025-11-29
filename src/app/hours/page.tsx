import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HoursPage() {
    const session = await getServerSession(authConfig)

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Time Management</h1>
                <p className="text-muted-foreground">Edit and manage your hours</p>
            </div>
        </div>
    )
}
