import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function UrnikNetOverviewLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { urnikUsername: true },
    })

    if (!user?.urnikUsername) {
        redirect("/profile")
    }

    return <>{children}</>
}
