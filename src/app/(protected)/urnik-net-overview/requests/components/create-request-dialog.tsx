import { getTranslations } from "next-intl/server"
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
            startDateLabel={t("startDateLabel")}
            endDateLabel={t("endDateLabel")}
            typeVacation={t("typeVacation")}
            typeSickLeave={t("typeSickLeave")}
            typeDayWorkFromHome={t("typeDayWorkFromHome")}
        />
    )
}
