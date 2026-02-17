import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, XCircle, TrendingUp, Calendar } from "lucide-react"
import type { DayInfo } from "../schemas/day-info-schema"
import { ClockButtons } from "./clock-buttons"

interface ClockViewProps {
    translations: {
        title: string
        description: string
        clockInButton: string
        clockOutButton: string
        clockInSuccess: string
        clockOutSuccess: string
        errorTitle: string
        arrivalLabel: string
        leaveLabel: string
        loggedLabel: string
        notLoggedLabel: string
        workFromHomeCheckbox: string
        workFromHomeApproved: string
        atLocation: string
    }
    status: {
        success: boolean
        data?: DayInfo
        error?: string
        structureValid?: boolean
    }
    hasApprovedWFH: boolean
    wfhLocation: string | null
}

const DataRow = ({ label, value }: { label: string; value: string | null }) => (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value || "—"}</span>
    </div>
)

export function ClockView({ translations, status, hasApprovedWFH, wfhLocation }: ClockViewProps) {
    const data = status.data

    if (!status.success || !data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {translations.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Unable to load day information</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Clock In/Out
                    </CardTitle>
                    <CardDescription>Manage your work time tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm font-medium">
                                {translations.arrivalLabel}:
                            </span>
                            {data.hasArrival ? (
                                <Badge variant="default" className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {translations.loggedLabel} {data.arrival}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="gap-1">
                                    <XCircle className="h-3 w-3" />
                                    {translations.notLoggedLabel}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm font-medium">{translations.leaveLabel}:</span>
                            {data.hasDeparture ? (
                                <Badge variant="default" className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {translations.loggedLabel} {data.departure}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="gap-1">
                                    <XCircle className="h-3 w-3" />
                                    {translations.notLoggedLabel}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <ClockButtons
                        translations={{
                            clockInButton: translations.clockInButton,
                            clockOutButton: translations.clockOutButton,
                            clockInSuccess: translations.clockInSuccess,
                            clockOutSuccess: translations.clockOutSuccess,
                            errorTitle: translations.errorTitle,
                            workFromHomeCheckbox: translations.workFromHomeCheckbox,
                            workFromHomeApproved: translations.workFromHomeApproved,
                            atLocation: translations.atLocation,
                        }}
                        hasApprovedWFH={hasApprovedWFH}
                        wfhLocation={wfhLocation}
                    />
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Today&apos;s Work Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <DataRow label="Lunch Break" value={data.lunchBreak} />
                            <DataRow label="Total Hours" value={data.totalHours} />
                            <DataRow label="Overtime Work" value={data.overtimeWork} />
                            <DataRow label="Shift Ends At" value={data.shiftEndsAt} />
                            <DataRow label="Planned" value={data.planned} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Balance Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <DataRow label="Balance Today" value={data.balanceToday} />
                            <DataRow label="Total Balance Now" value={data.totalBalanceNow} />
                            <DataRow
                                label="Total Annual Balance Yesterday"
                                value={data.totalAnnualBalanceYesterday}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Vacation & Leave
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                            <DataRow label="Last Year Vacation" value={data.lastYearVacation} />
                            <DataRow label="This Year's Leave" value={data.thisYearLeave} />
                            <DataRow label="Total Vacation Days" value={data.totalVacationDays} />
                        </div>
                        <div className="space-y-1">
                            <DataRow label="Set Work Time" value={data.setWorkTime} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
