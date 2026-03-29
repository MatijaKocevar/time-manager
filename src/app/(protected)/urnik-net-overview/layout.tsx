import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export default async function UrnikNetOverviewLayout({ children }: { children: React.ReactNode }) {
    const session = await requireAuth().catch(() => redirect("/login"))

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { urnikUsername: true },
    })

    if (!user?.urnikUsername) {
        redirect("/profile")
    }

    return <>{children}</>
}
