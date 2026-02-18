import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { ClockView } from "./components/clock-view"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { getArrivalLeaveStatus, getTodayWorkFromHomeStatus } from "@/lib/clock-status"

export default async function ClockPage() {
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

    const t = await getTranslations("clock")
    const tCommon = await getTranslations("common")

    if (!user?.urnikUsername || !user?.urnikPassword) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("page.title")}</h1>
                </div>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t("page.noCredentialsTitle")}</AlertTitle>
                    <AlertDescription>
                        {t("page.noCredentialsDescription")}{" "}
                        <Link href="/profile" className="underline">
                            {t("page.profileLink")}
                        </Link>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const status = await getArrivalLeaveStatus()
    const wfhStatus = await getTodayWorkFromHomeStatus()

    const translations = {
        title: t("view.title"),
        description: t("view.description"),
        clockInButton: t("actions.clockIn"),
        clockOutButton: t("actions.clockOutAndStop"),
        clockInSuccess: t("messages.clockInSuccess"),
        clockOutSuccess: t("messages.clockOutSuccess"),
        errorTitle: tCommon("messages.error"),
        arrivalLabel: t("status.arrival"),
        leaveLabel: t("status.leave"),
        loggedLabel: t("status.logged"),
        notLoggedLabel: t("status.notLogged"),
        workFromHomeCheckbox: t("arrivalDialog.workFromHomeCheckbox"),
        workFromHomeApproved: t("arrivalDialog.workFromHomeApproved"),
        atLocation: wfhStatus.location
            ? t("arrivalDialog.atLocation", { location: wfhStatus.location })
            : "",
        todayWorkTimeTitle: t("todayWorkTime.title"),
        lunchBreak: t("todayWorkTime.lunchBreak"),
        totalHours: t("todayWorkTime.totalHours"),
        overtimeWork: t("todayWorkTime.overtimeWork"),
        shiftEndsAt: t("todayWorkTime.shiftEndsAt"),
        planned: t("todayWorkTime.planned"),
        balanceTitle: t("balance.title"),
        balanceToday: t("balance.balanceToday"),
        totalBalanceNow: t("balance.totalBalanceNow"),
        totalAnnualBalanceYesterday: t("balance.totalAnnualBalanceYesterday"),
        vacationTitle: t("vacation.title"),
        lastYearVacation: t("vacation.lastYearVacation"),
        thisYearLeave: t("vacation.thisYearLeave"),
        totalVacationDays: t("vacation.totalVacationDays"),
        setWorkTime: t("vacation.setWorkTime"),
    }

    return (
        <div className="space-y-6">
            {!status.success && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t("messages.errorLoadingDayInfo")}</AlertTitle>
                    <AlertDescription>{status.error}</AlertDescription>
                </Alert>
            )}
            {status.success && status.structureValid === false && (
                <Alert variant="default">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t("messages.structureChangedWarning")}</AlertTitle>
                    <AlertDescription>{t("messages.structureChangedDescription")}</AlertDescription>
                </Alert>
            )}
            <ClockView
                translations={translations}
                status={status}
                hasApprovedWFH={wfhStatus.hasApprovedWFH}
                wfhLocation={wfhStatus.location}
            />
        </div>
    )
}
