import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAuthIdentity, type AuthIdentity } from "@/lib/auth-identity"

const API_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

function toApiSession(identity: AuthIdentity): Session {
    return {
        user: {
            id: identity.userId,
            email: identity.email,
            name: identity.name,
            image: null,
            role: identity.role,
            locale: identity.locale,
            isDemo: identity.isDemo,
        },
        expires: new Date(Date.now() + API_SESSION_TTL_MS).toISOString(),
    }
}

export async function requireAuth() {
    const session = await getServerSession(authConfig)

    if (session?.user) {
        return session
    }

    const identity = getAuthIdentity()

    if (identity) {
        return toApiSession(identity)
    }

    throw new Error("Unauthorized")
}

export async function requireAdmin() {
    const session = await requireAuth()

    if (session.user.role !== "ADMIN") {
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
