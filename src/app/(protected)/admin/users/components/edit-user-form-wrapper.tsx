import { getTranslations } from "next-intl/server"
import { getUserRoleTranslationKey } from "../utils/translation-helpers"
import { EditUserFormClient } from "./edit-user-form"
import { type UserRole } from "../schemas/user-action-schemas"

interface EditUserFormUser {
    id: string
    name: string | null
    email: string
    role: UserRole
    isDemo: boolean
    isActive: boolean
    deactivatedAt: Date | null
    anonymizedAt: Date | null
}

interface EditUserFormProps {
    user: EditUserFormUser
    currentUserIsDemo: boolean
}

export async function EditUserForm({ user, currentUserIsDemo }: EditUserFormProps) {
    const [t, tRoles, tCommon, tCommonMessages] = await Promise.all([
        getTranslations("admin.users.form"),
        getTranslations("admin.users.roles"),
        getTranslations("common.actions"),
        getTranslations("common.messages"),
    ])

    const userName = user.name ?? "this user"

    return (
        <EditUserFormClient
            user={user}
            currentUserIsDemo={currentUserIsDemo}
            translations={{
                nameLabel: t("name"),
                emailLabel: t("email"),
                roleLabel: t("role"),
                roleLabels: {
                    USER: tRoles(getUserRoleTranslationKey("USER")),
                    ADMIN: tRoles(getUserRoleTranslationKey("ADMIN")),
                },
                saving: t("saving"),
                saveChanges: t("saveChanges"),
                cancel: tCommon("cancel"),
                changePasswordLabel: t("changePassword"),
                enterNewPasswordPlaceholder: t("enterNewPassword"),
                demoRestriction: tCommonMessages("demoRestriction"),
                confirmPasswordLabel: t("confirmPassword"),
                confirmNewPasswordPlaceholder: t("confirmNewPassword"),
                changing: t("changing"),
                deactivateUserLabel: t("deactivateUser"),
                reactivateUserLabel: t("reactivateUser"),
                deactivateDescription: t("deactivateConfirm", { name: "" }).split("?")[0],
                reactivateDescription: t("reactivateConfirm", { name: "" }).split("?")[0],
                deactivating: t("deactivating"),
                reactivating: t("reactivating"),
                anonymizeUserLabel: t("anonymizeUser"),
                anonymizeDescription: t("anonymizeConfirm", { name: "" }).split("?")[0],
                anonymizing: t("anonymizing"),
                passwordMismatch: t("passwordMismatch"),
                deactivateConfirmMsg: t("deactivateConfirm", { name: userName }),
                reactivateConfirmMsg: t("reactivateConfirm", { name: userName }),
                anonymizeConfirmMsg: t("anonymizeConfirm", { name: userName }),
            }}
        />
    )
}
