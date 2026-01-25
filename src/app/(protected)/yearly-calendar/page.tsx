import { getTranslations } from "next-intl/server"
import { getYearlyCalendarData } from "./actions/yearly-calendar-actions"
import { YearlyCalendarClient } from "./components/yearly-calendar-client"

export default async function YearlyCalendarPage() {
    const t = await getTranslations("yearlyCalendar")
    const tTimeSheets = await getTranslations("timeSheets.dayEntriesDialog")

    const currentYear = new Date().getFullYear()
    const result = await getYearlyCalendarData({ year: currentYear })
    const initialData = result.data || {}

    const months = Array.from({ length: 12 }, (_, i) => t(`months.${i}`))

    return (
        <div className="flex flex-col gap-4 h-full">
            <YearlyCalendarClient
                initialYear={currentYear}
                initialData={initialData}
                translations={{
                    header: {
                        title: t("title"),
                        year: t("year"),
                    },
                    months,
                    dayEntriesDialog: {
                        title: tTimeSheets("title"),
                        description: tTimeSheets("description"),
                        startedAt: tTimeSheets("startedAt"),
                        endedAt: tTimeSheets("endedAt"),
                        duration: tTimeSheets("duration"),
                        task: tTimeSheets("task"),
                        active: tTimeSheets("active"),
                        noEntries: tTimeSheets("noEntries"),
                        close: tTimeSheets("close"),
                    },
                }}
            />
        </div>
    )
}
