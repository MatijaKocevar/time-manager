import { getTranslations } from "next-intl/server"
import { getHolidays } from "./_actions/holiday-actions"
import { HolidaysTable } from "./_components/holidays-table"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

export const dynamic = "force-dynamic"

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

    const [tutorialsSeen, tTutorial, tAdminHolidays] = await Promise.all([
        getTutorialsSeen(),
        getTranslations("tutorial"),
        getTranslations("tutorial.adminHolidays"),
    ])

    return (
        <>
            <PageTour
                pageKey="/admin/holidays"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#holidays-year-nav",
                        title: tAdminHolidays("yearNav.title"),
                        description: tAdminHolidays("yearNav.description"),
                        side: "bottom",
                    },
                    {
                        element: "#holidays-import-btn",
                        title: tAdminHolidays("importBtn.title"),
                        description: tAdminHolidays("importBtn.description"),
                        side: "bottom",
                    },
                    {
                        element: "#holidays-add-btn",
                        title: tAdminHolidays("addBtn.title"),
                        description: tAdminHolidays("addBtn.description"),
                        side: "bottom",
                    },
                    {
                        element: "#holidays-table",
                        title: tAdminHolidays("table.title"),
                        description: tAdminHolidays("table.description"),
                        side: "top",
                    },
                ]}
            />
            <div className="flex flex-col gap-4 min-w-0 h-full">
                <HolidaysTable holidays={holidays} translations={translations} />
            </div>
        </>
    )
}
