import { AsyncLocalStorage } from "node:async_hooks"
import type { UserRole } from "@/../../prisma/generated/client"

export interface AuthIdentity {
    userId: string
    role: UserRole
    isDemo: boolean
    locale: string
    email: string
    name: string | null
}

const authIdentityStorage = new AsyncLocalStorage<AuthIdentity>()

export function runWithAuthIdentity<T>(identity: AuthIdentity, fn: () => T): T {
    return authIdentityStorage.run(identity, fn)
}

export function getAuthIdentity(): AuthIdentity | null {
    return authIdentityStorage.getStore() ?? null
}
