import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth-helpers"
import { getTranslations } from "next-intl/server"
import { ClockView } from "./_components/clock-view"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import {
    getArrivalLeaveStatus,
    getTodayWorkFromHomeStatus,
} from "@/app/(protected)/urnik-net-overview/_utils/clock-status"
import { getTutorialsSeen, PageTour } from "@/features/tutorial"

export default async function ClockPage() {
    await requireAuth().catch(() => redirect("/login"))

    const [t, tCommon, tTutorial, tPage, tutorialsSeen, status, wfhStatus] = await Promise.all([
        getTranslations("clock"),
        getTranslations("common"),
        getTranslations("tutorial"),
        getTranslations("tutorial.urnikNetClock"),
        getTutorialsSeen(),
        getArrivalLeaveStatus(),
        getTodayWorkFromHomeStatus(),
    ])

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
        <>
            <PageTour
                pageKey="/urnik-net-overview"
                seenPages={tutorialsSeen}
                nextLabel={tTutorial("next")}
                prevLabel={tTutorial("previous")}
                doneLabel={tTutorial("done")}
                steps={[
                    {
                        element: "#urnik-clock-card",
                        title: tPage("clockCard.title"),
                        description: tPage("clockCard.description"),
                        side: "bottom",
                    },
                    {
                        element: "#urnik-work-time",
                        title: tPage("workTime.title"),
                        description: tPage("workTime.description"),
                        side: "bottom",
                    },
                    {
                        element: "#urnik-balance",
                        title: tPage("balance.title"),
                        description: tPage("balance.description"),
                        side: "bottom",
                    },
                    {
                        element: "#urnik-vacation",
                        title: tPage("vacation.title"),
                        description: tPage("vacation.description"),
                        side: "bottom",
                    },
                ]}
            />
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
                        <AlertDescription>
                            {t("messages.structureChangedDescription")}
                        </AlertDescription>
                    </Alert>
                )}
                <ClockView
                    translations={translations}
                    status={status}
                    hasApprovedWFH={wfhStatus.hasApprovedWFH}
                    wfhLocation={wfhStatus.location}
                />
            </div>
        </>
    )
}
