import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { fetchMonthlyHours } from "./actions/hours-actions"
import { NoCredentialsAlert } from "./components/no-credentials-alert"
import { HoursView } from "./components/hours-view"

export const dynamic = "force-dynamic"

export default async function UrnikNetHoursPage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string; month?: string }>
}) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            urnikUsername: true,
            urnikPassword: true,
        },
    })

    const t = await getTranslations("urnikNetHours")
    const tYearlyCalendar = await getTranslations("yearlyCalendar")

    if (!user?.urnikUsername || !user?.urnikPassword) {
        return (
            <NoCredentialsAlert
                translations={{
                    title: t("page.title"),
                    noCredentialsTitle: t("page.noCredentialsTitle"),
                    noCredentialsDescription: t("page.noCredentialsDescription"),
                    profileLink: t("page.profileLink"),
                }}
            />
        )
    }

    const params = await searchParams
    const today = new Date()
    const currentYear = params.year ? parseInt(params.year) : today.getFullYear()
    const currentMonth = params.month ? parseInt(params.month) : today.getMonth() + 1

    const monthName = tYearlyCalendar(`months.${currentMonth - 1}`)

    const result = await fetchMonthlyHours(currentYear, currentMonth)

    return (
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
                        clockIn: t("table.clockIn"),
                        clockOut: t("table.clockOut"),
                        attendance: t("table.attendance"),
                        accounted: t("table.accounted"),
                        dayBalance: t("table.dayBalance"),
                        balanceMonth: t("table.balanceMonth"),
                        balanceYear: t("table.balanceYear"),
                    },
                }}
            />
        </div>
    )
}
