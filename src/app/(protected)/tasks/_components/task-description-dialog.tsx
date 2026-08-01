import { getTranslations } from "next-intl/server"
import { TaskDescriptionDialogClient } from "./task-description-dialog-client"

export async function TaskDescriptionDialog() {
    const t = await getTranslations("tasks.description")

    return (
        <TaskDescriptionDialogClient
            translations={{
                dialogTitle: t("dialogTitle"),
                placeholder: t("placeholder"),
                save: t("save"),
                saving: t("saving"),
                uploadImage: t("uploadImage"),
                editTitle: t("editTitle"),
                uploadError: t("uploadError"),
                saveError: t("saveError"),
            }}
        />
    )
}
