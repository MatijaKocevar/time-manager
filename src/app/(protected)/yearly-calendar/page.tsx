import { getTranslations } from "next-intl/server"
import { getYearlyCalendarData } from "./_actions/yearly-calendar-actions"
import { YearlyCalendarClient } from "./_components/yearly-calendar-client"
import { getHolidaysInRange } from "../admin/holidays/_actions/holiday-actions"
import { calculateOvertimeFund } from "@/lib/overtime"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

export default async function YearlyCalendarPage() {
    const [t, tTimeSheets, tutorialsSeen, tTutorial, tYearlyCal] = await Promise.all([
        getTranslations("yearlyCalendar"),
        getTranslations("timeSheets.dayEntriesDialog"),
        getTutorialsSeen(),
        getTranslations("tutorial"),
        getTranslations("tutorial.yearlyCalendar"),
    ])

    const session = await getServerSession(authConfig)
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const currentYear = new Date().getFullYear()
    const result = await getYearlyCalendarData({ year: currentYear })
    const initialData = result.data || {}

    const startOfYear = new Date(Date.UTC(currentYear, 0, 1))
    const endOfYear = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999))

    const holidays = await getHolidaysInRange(startOfYear.toISOString(), endOfYear.toISOString())

    const yearlyBalance = await calculateOvertimeFund(session.user.id, currentYear)

    const months = Array.from({ length: 12 }, (_, i) => t(`months.${i}`))

    return (
        <div className="flex flex-col gap-4 h-full">
            <PageTour
                pageKey="/yearly-calendar"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#yearly-nav-controls",
                        title: tYearlyCal("navigation.title"),
                        description: tYearlyCal("navigation.description"),
                        side: "bottom",
                    },
                    {
                        element: "#yearly-balance",
                        title: tYearlyCal("balance.title"),
                        description: tYearlyCal("balance.description"),
                        side: "bottom",
                    },
                    {
                        element: "#yearly-table",
                        title: tYearlyCal("calendar.title"),
                        description: tYearlyCal("calendar.description"),
                        side: "top",
                    },
                    {
                        element: ".yearly-cell",
                        title: tYearlyCal("cell.title"),
                        description: tYearlyCal("cell.description"),
                        side: "top",
                    },
                ]}
            />
            <YearlyCalendarClient
                initialYear={currentYear}
                initialData={initialData}
                yearlyBalance={yearlyBalance}
                initialHolidays={holidays}
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
