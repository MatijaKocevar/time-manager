import { z } from "zod"
import type { AuthInfo } from "@modelcontextprotocol/server"
import { resolveApiTokenIdentity } from "@/lib/api-tokens"
import type { AuthIdentity } from "@/lib/auth-identity"

const authIdentitySchema = z.object({
    userId: z.string(),
    role: z.enum(["USER", "ADMIN"]),
    isDemo: z.boolean(),
    locale: z.string(),
    email: z.string(),
    name: z.string().nullable(),
})

export async function verifyApiToken(
    _request: Request,
    bearerToken?: string
): Promise<AuthInfo | undefined> {
    if (!bearerToken) {
        return undefined
    }

    const identity = await resolveApiTokenIdentity(bearerToken)

    if (!identity) {
        return undefined
    }

    return {
        token: bearerToken,
        clientId: identity.userId,
        scopes: [],
        extra: { identity },
    }
}

export function identityFromAuthInfo(authInfo?: AuthInfo): AuthIdentity | null {
    const parsed = authIdentitySchema.safeParse(authInfo?.extra?.identity)

    return parsed.success ? parsed.data : null
}
