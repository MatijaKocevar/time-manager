import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authConfig)

    if (session!.user.role !== "ADMIN") {
        redirect("/tracker")
    }

    return <>{children}</>
}
