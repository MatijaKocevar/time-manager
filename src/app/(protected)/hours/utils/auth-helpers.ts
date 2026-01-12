import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

export async function requireAdmin() {
    const session = await getServerSession(authConfig)
    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized - Admin access required")
    }
    return session
}

export async function requireNotDemo(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isDemo: true },
    })

    if (user?.isDemo) {
        throw new Error("This feature is disabled for the demo account")
    }
}
