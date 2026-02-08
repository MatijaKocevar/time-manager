import { getTranslations } from "next-intl/server"
import { getYearlyCalendarData } from "./actions/yearly-calendar-actions"
import { YearlyCalendarClient } from "./components/yearly-calendar-client"
import { getCurrentUser } from "../profile/actions/profile-actions"
import { getHolidaysInRange } from "../admin/holidays/actions/holiday-actions"
import { calculateExpectedHoursToDate } from "@/lib/balance-helpers"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"

export default async function YearlyCalendarPage() {
    const t = await getTranslations("yearlyCalendar")
    const tTimeSheets = await getTranslations("timeSheets.dayEntriesDialog")

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
    const endDate =
        currentYear === today.getFullYear()
            ? new Date(
                  Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
              )
            : new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999))

    const holidays = await getHolidaysInRange(startOfYear.toISOString(), endDate.toISOString())

    let yearlyBalance = 0
    const currentMonth = today.getMonth()

    console.log("\n=== YEARLY BALANCE DEBUG ===")
    console.log("Current year:", currentYear)
    console.log("Current month:", currentMonth)
    console.log("User ID:", session.user.id)
    console.log("Work hours per day:", userWorkHoursPerDay)

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

        console.log(
            `\nMONTH ${month} (${monthStart.toISOString().split("T")[0]} to ${monthEnd.toISOString().split("T")[0]}):`
        )
        console.log(`  Summaries found: ${monthSummaries.length}`)
        console.log(
            `  Sample summaries:`,
            monthSummaries.slice(0, 3).map((s) => ({
                date: s.date.toISOString().split("T")[0],
                type: s.type,
                totalHours: Number(s.totalHours),
            }))
        )

        const monthTotalHours = monthSummaries.reduce((sum, s) => sum + Number(s.totalHours), 0)

        const monthStartLocal = new Date(currentYear, month, 1)
        const monthEndLocal = new Date(currentYear, month + 1, 0)

        console.log(`  monthStart local: ${monthStartLocal.toISOString()}`)
        console.log(`  monthEnd local: ${monthEndLocal.toISOString()}`)

        const monthExpectedHours = calculateExpectedHoursToDate(
            monthStartLocal,
            monthEndLocal,
            holidays,
            userWorkHoursPerDay
        )

        console.log(`  Total worked hours: ${monthTotalHours}`)
        console.log(`  Expected hours: ${monthExpectedHours}`)

        const monthBalance = monthTotalHours - monthExpectedHours
        console.log(`  Balance: ${monthBalance}`)

        yearlyBalance += monthBalance
        console.log(`  Running yearly balance: ${yearlyBalance}`)
    }

    console.log(`\nFINAL YEARLY BALANCE: ${yearlyBalance}`)
    console.log("=== END DEBUG ===\n")

    const months = Array.from({ length: 12 }, (_, i) => t(`months.${i}`))

    return (
        <div className="flex flex-col gap-4 h-full">
            <YearlyCalendarClient
                initialYear={currentYear}
                initialData={initialData}
                yearlyBalance={yearlyBalance}
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
