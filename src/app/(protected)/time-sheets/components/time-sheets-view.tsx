import { getTranslations } from "next-intl/server"
import { TimeSheetsClient } from "./time-sheets-client"
import { TimeEntriesDialog } from "../../tasks/components/time-entries-dialog"

export async function TimeSheetsView() {
    const t = await getTranslations("timeSheets")

    return (
        <>
            <TimeSheetsClient
                translations={{
                    week: t("viewMode.week"),
                    month: t("viewMode.month"),
                    task: t("table.task"),
                    noData: t("messages.noData"),
                    loading: t("messages.loading"),
                    error: t("messages.error"),
                }}
            />
            <TimeEntriesDialog />
        </>
    )
}
