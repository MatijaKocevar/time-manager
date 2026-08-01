import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth-helpers"
import { getTranslations } from "next-intl/server"
import { fetchMonthlyHours } from "./_actions/hours-actions"
import { HoursView } from "./_components/hours-view"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

export const dynamic = "force-dynamic"

export default async function UrnikNetHoursPage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string; month?: string }>
}) {
    await requireAuth().catch(() => redirect("/login"))

    const [t, tYearlyCalendar, tTutorial, tPage, tutorialsSeen] = await Promise.all([
        getTranslations("urnikNetHours"),
        getTranslations("yearlyCalendar"),
        getTranslations("tutorial"),
        getTranslations("tutorial.urnikNetHours"),
        getTutorialsSeen(),
    ])

    const params = await searchParams
    const today = new Date()
    const currentYear = params.year ? parseInt(params.year) : today.getFullYear()
    const currentMonth = params.month ? parseInt(params.month) : today.getMonth() + 1

    const monthName = tYearlyCalendar(`months.${currentMonth - 1}`)

    const result = await fetchMonthlyHours(currentYear, currentMonth)

    return (
        <>
            <PageTour
                pageKey="/urnik-net-overview/hours"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#urnik-hours-nav",
                        title: tPage("nav.title"),
                        description: tPage("nav.description"),
                        side: "bottom",
                    },
                    {
                        element: "#urnik-hours-details",
                        title: tPage("details.title"),
                        description: tPage("details.description"),
                        side: "bottom",
                    },
                    {
                        element: "#urnik-hours-table",
                        title: tPage("table.title"),
                        description: tPage("table.description"),
                        side: "top",
                    },
                ]}
            />
            <div className="flex flex-col gap-4 h-full">
                <HoursView
                    result={result}
                    currentYear={currentYear}
                    currentMonth={currentMonth}
                    monthName={monthName}
                    translations={{
                        previousMonth: t("previousMonth"),
                        nextMonth: t("nextMonth"),
                        detailsButton: t("detailsButton"),
                        summary: {
                            billingHours: t("summary.billingHours"),
                            plannedHours: t("summary.plannedHours"),
                            workDays: t("summary.workDays"),
                            holidays: t("summary.holidays"),
                            lunches: t("summary.lunches"),
                            vacationBalance: t("summary.vacationBalance"),
                            vacationBalanceShort: t("summary.vacationBalanceShort"),
                            sickLeave: t("summary.sickLeave"),
                            leaveDays: t("summary.leaveDays"),
                            balance: t("summary.balance"),
                            workFromHome: t("summary.workFromHome"),
                            userType: t("summary.userType"),
                            hoursInDay: t("summary.hoursInDay"),
                        },
                        table: {
                            no: t("table.no"),
                            date: t("table.date"),
                            day: t("table.day"),
                            status: t("table.status"),
                            graph: t("table.graph"),
                            clockIn: t("table.clockIn"),
                            clockOut: t("table.clockOut"),
                            attendance: t("table.attendance"),
                            accounted: t("table.accounted"),
                            dayBalance: t("table.dayBalance"),
                            balanceMonth: t("table.balanceMonth"),
                            balanceYear: t("table.balanceYear"),
                        },
                        dayInfoDialog: {
                            title: t("dayInfoDialog.title"),
                            start: t("dayInfoDialog.start"),
                            end: t("dayInfoDialog.end"),
                            duration: t("dayInfoDialog.duration"),
                            type: t("dayInfoDialog.type"),
                            workWithoutBreak: t("dayInfoDialog.workWithoutBreak"),
                            lunchBreak: t("dayInfoDialog.lunchBreak"),
                            withBreak: t("dayInfoDialog.withBreak"),
                            loading: t("dayInfoDialog.loading"),
                            error: t("dayInfoDialog.error"),
                        },
                    }}
                />
            </div>
        </>
    )
}
