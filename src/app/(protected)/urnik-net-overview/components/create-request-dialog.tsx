import { getTranslations } from "next-intl/server"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RequestTypeSelector } from "./request-type-selector"
import { CreateRequestForm } from "./create-request-form"
import { CreateRequestDialogClient } from "./create-request-dialog-client"

export async function CreateRequestDialog() {
    const t = await getTranslations("urnikNetOverview.createRequest")

    return (
        <CreateRequestDialogClient
            dialogTitle={t("dialogTitle")}
            typeLabel={t("typeLabel")}
            typePlaceholder={t("typePlaceholder")}
            typeWork={t("typeWork")}
            typeWorkFromHome={t("typeWorkFromHome")}
            dateLabel={t("dateLabel")}
            startTimeLabel={t("startTimeLabel")}
            endTimeLabel={t("endTimeLabel")}
            commentLabel={t("commentLabel")}
            submitButton={t("submitButton")}
            successMessage={t("successMessage")}
            errorPrefix={t("errorPrefix")}
            retryButton={t("retryButton")}
        />
    )
}
