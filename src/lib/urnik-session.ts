import { getServerSession } from "next-auth"
import { authConfig } from "./auth"
import { prisma } from "./prisma"
import { loginToUrnik } from "@/app/(protected)/urnik-sync/actions/urnik-actions"

export async function getUrnikCookie(): Promise<string | null> {
    try {
        const session = await getServerSession(authConfig)

        if (!session?.user) {
            return null
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { urnikUsername: true, urnikPassword: true },
        })

        if (!user?.urnikUsername || !user?.urnikPassword) {
            return null
        }

        const result = await loginToUrnik(user.urnikUsername, user.urnikPassword)

        if (result.success && result.cookie) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { lastUrnikTestAt: new Date() },
            })

            return result.cookie
        }

        return null
    } catch (error) {
        console.error("Failed to get urnik cookie:", error)
        return null
    }
}
