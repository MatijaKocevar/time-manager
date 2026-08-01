import { getTranslations } from "next-intl/server"
import type { UserTableItem } from "../_schemas/user-table-schemas"
import { getUserRoleTranslationKey } from "../_utils/translation-helpers"
import { UsersTableClient } from "./users-table"

interface UsersTableWrapperProps {
    users: UserTableItem[]
    currentUserId: string
}

export async function UsersTableWrapper({ users, currentUserId }: UsersTableWrapperProps) {
    const [t, tRoles, tUsers, tForm, tCommon, tCommonMessages] = await Promise.all([
        getTranslations("admin.users.table"),
        getTranslations("admin.users.roles"),
        getTranslations("admin.users"),
        getTranslations("admin.users.form"),
        getTranslations("common.actions"),
        getTranslations("common.messages"),
    ])

    return (
        <UsersTableClient
            users={users}
            currentUserId={currentUserId}
            translations={{
                filterPlaceholder: t("filterPlaceholder"),
                showDeactivated: t("showDeactivated"),
                createUser: tUsers("createUser"),
                exportLabel: tCommon("export"),
                name: t("name"),
                email: t("email"),
                role: t("role"),
                status: t("status"),
                created: t("created"),
                actions: t("actions"),
                you: t("you"),
                roleLabels: {
                    USER: tRoles(getUserRoleTranslationKey("USER")),
                    ADMIN: tRoles(getUserRoleTranslationKey("ADMIN")),
                },
                statusActive: t("active"),
                statusInactive: t("inactive"),
                statusAnonymized: t("anonymized"),
                noUsersMatch: t("noUsersMatch"),
                noUsers: t("noUsers"),
                edit: t("edit"),
                fillDetails: tForm("fillDetails"),
                nameLabel: tForm("name"),
                namePlaceholder: tForm("namePlaceholder"),
                emailLabel: tForm("email"),
                emailPlaceholder: tForm("emailPlaceholder"),
                passwordLabel: tForm("password"),
                passwordPlaceholder: tForm("passwordPlaceholder"),
                roleLabel: tForm("role"),
                selectRole: tForm("selectRole"),
                cancel: tCommon("cancel"),
                saving: tCommon("saving"),
                save: tCommon("save"),
                errorMessage: tCommonMessages("error"),
            }}
        />
    )
}
