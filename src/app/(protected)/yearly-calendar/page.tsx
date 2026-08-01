import { getTranslations } from "next-intl/server"
import { getYearlyCalendarData } from "./_actions/yearly-calendar-actions"
import { YearlyCalendarClient } from "./_components/yearly-calendar-client"
import { getCurrentUser } from "../profile/_actions/profile-actions"
import { getHolidaysInRange } from "../admin/holidays/_actions/holiday-actions"
import { calculateExpectedHoursToDate } from "@/lib/balance-helpers"
import { prisma } from "@/lib/prisma"
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

    const currentUser = await getCurrentUser()
    const userWorkHoursPerDay = currentUser?.workHoursPerDay || 8

    const startOfYear = new Date(Date.UTC(currentYear, 0, 1))
    const today = new Date()

    const endOfYear = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999))

    const holidays = await getHolidaysInRange(startOfYear.toISOString(), endOfYear.toISOString())

    let yearlyBalance = 0
    const currentMonth = today.getMonth()

    for (let month = 0; month <= currentMonth; month++) {
        const monthStart = new Date(Date.UTC(currentYear, month, 1))
        const monthEnd = new Date(Date.UTC(currentYear, month + 1, 0, 23, 59, 59, 999))

        const monthSummaries = await prisma.dailyHourSummary.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            },
        })

        const monthTotalHours = monthSummaries.reduce((sum, s) => sum + Number(s.totalHours), 0)

        const monthStartLocal = new Date(currentYear, month, 1)
        const monthEndLocal = new Date(currentYear, month + 1, 0)

        const monthExpectedHours = calculateExpectedHoursToDate(
            monthStartLocal,
            monthEndLocal,
            holidays,
            userWorkHoursPerDay
        )

        const monthBalance = monthTotalHours - monthExpectedHours
        yearlyBalance += monthBalance
    }

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
