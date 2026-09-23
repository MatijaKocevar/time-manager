import { createHash, randomBytes } from "node:crypto"
import { prisma } from "@/lib/prisma"
import type { AuthIdentity } from "@/lib/auth-identity"

export const API_TOKEN_PREFIX = "tm_"

const LAST_USED_THROTTLE_MS = 60_000

export function generateApiToken(): string {
    return `${API_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`
}

export function hashApiToken(token: string): string {
    return createHash("sha256").update(token).digest("hex")
}

export async function resolveApiTokenIdentity(bearerToken: string): Promise<AuthIdentity | null> {
    if (!bearerToken.startsWith(API_TOKEN_PREFIX)) {
        return null
    }

    const apiToken = await prisma.apiToken.findUnique({
        where: { tokenHash: hashApiToken(bearerToken) },
        select: {
            id: true,
            lastUsedAt: true,
            expiresAt: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isDemo: true,
                    locale: true,
                    isActive: true,
                },
            },
        },
    })

    if (!apiToken || !apiToken.user?.isActive) {
        return null
    }

    if (apiToken.expiresAt && apiToken.expiresAt.getTime() <= Date.now()) {
        return null
    }

    const now = Date.now()

    if (!apiToken.lastUsedAt || now - apiToken.lastUsedAt.getTime() > LAST_USED_THROTTLE_MS) {
        void prisma.apiToken
            .update({
                where: { id: apiToken.id },
                data: { lastUsedAt: new Date() },
            })
            .catch(() => undefined)
    }

    return {
        userId: apiToken.user.id,
        role: apiToken.user.role,
        isDemo: apiToken.user.isDemo,
        locale: apiToken.user.locale,
        email: apiToken.user.email,
        name: apiToken.user.name,
    }
}
