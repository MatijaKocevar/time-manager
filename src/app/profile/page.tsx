import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProfileForm } from "./components/profile-form"
import { UserAvatar } from "@/components/user-avatar"

export default async function ProfilePage() {
    const session = await getServerSession(authConfig)

    if (!session) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    })

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground">Manage your account settings</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                    <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
                        <UserAvatar role={user.role} className="h-24 w-24" />
                        <div className="text-center">
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <span
                                className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    user.role === "ADMIN"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-blue-100 text-blue-800"
                                }`}
                            >
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <ProfileForm user={user} />
                </div>
            </div>
        </div>
    )
}
