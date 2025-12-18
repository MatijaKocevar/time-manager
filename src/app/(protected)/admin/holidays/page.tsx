import { Card, CardContent } from "@/components/ui/card"
import { getTranslations } from "next-intl/server"
import { getHolidays } from "./actions/holiday-actions"
import { HolidaysTable } from "./components/holidays-table"

export default async function HolidaysPage() {
    const result = await getHolidays()
    const holidays = result.success && result.data ? result.data : []

    const t = await getTranslations("admin.holidays")
    const tTable = await getTranslations("admin.holidays.table")
    const tForm = await getTranslations("admin.holidays.form")
    const tActions = await getTranslations("admin.holidays.actions")

    const translations = {
        title: t("title"),
        table: {
            date: tTable("date"),
            name: tTable("name"),
            description: tTable("description"),
            recurring: tTable("recurring"),
            actions: tTable("actions"),
            noHolidays: tTable("noHolidays"),
            yes: tTable("yes"),
            no: tTable("no"),
        },
        form: {
            addHoliday: tForm("addHoliday"),
            editHoliday: tForm("editHoliday"),
            date: tForm("date"),
            name: tForm("name"),
            description: tForm("description"),
            recurringAnnually: tForm("recurringAnnually"),
            cancel: tForm("cancel"),
            create: tForm("create"),
            update: tForm("update"),
        },
        actions: {
            importPublicHolidays: tActions("importPublicHolidays"),
            importing: tActions("importing"),
            deleteConfirm: tActions("deleteConfirm"),
        },
    }

    return (
        <div className="flex flex-col gap-6">
            <Card className="flex-1 flex flex-col">
                <CardContent className="flex-1 flex flex-col p-6">
                    <HolidaysTable holidays={holidays} translations={translations} />
                </CardContent>
            </Card>
        </div>
    )
}
