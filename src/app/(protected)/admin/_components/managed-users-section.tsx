import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { getAdminSettings } from "../_actions/admin-settings-actions"
import { ManagedUsersClient } from "./managed-users-client"

export async function ManagedUsersSection() {
    const settings = await getAdminSettings()

    const [users, t] = await Promise.all([
        prisma.user.findMany({
            where: { isActive: true, id: { not: settings.currentAdminId } },
            select: { id: true, name: true, email: true },
            orderBy: { name: "asc" },
        }),
        getTranslations("admin.managedUsers"),
    ])

    const translations = {
        title: t("title"),
        description: t("description"),
        emptyDescription: t("emptyDescription"),
        autoAdminLabel: t("autoAdminLabel"),
        autoAdminDescription: t("autoAdminDescription"),
        selectAll: t("selectAll"),
        deselectAll: t("deselectAll"),
        saveButton: t("saveButton"),
        saving: t("saving"),
        saveSuccess: t("saveSuccess"),
        saveError: t("saveError"),
        noUsers: t("noUsers"),
    }

    return (
        <ManagedUsersClient
            initialManagedUserIds={settings.managedUserIds}
            initialAutoAdmin={settings.autoAdmin}
            users={users}
            translations={translations}
        />
    )
}
