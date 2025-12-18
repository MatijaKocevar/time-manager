import type { UserRole } from "../schemas/user-action-schemas"

const USER_ROLE_TO_TRANSLATION_KEY: Record<UserRole, string> = {
    USER: "user",
    ADMIN: "admin",
}

export function getUserRoleTranslationKey(role: UserRole): string {
    return USER_ROLE_TO_TRANSLATION_KEY[role]
}
