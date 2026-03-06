import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle } from "lucide-react"
import type { ParsedHoursResult } from "../schemas/hours-schema"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface HoursViewProps {
    result: ParsedHoursResult
    translations: {
        summary: {
            billingHours: string
            plannedHours: string
            workDays: string
            holidays: string
            lunches: string
            vacationBalance: string
            sickLeave: string
            leaveDays: string
            balance: string
            workFromHome: string
            userType: string
            hoursInDay: string
        }
        table: {
            no: string
            date: string
            day: string
            status: string
            clockIn: string
            clockOut: string
            attendance: string
            accounted: string
            dayBalance: string
            balanceMonth: string
            balanceYear: string
        }
    }
}

export function HoursView({ result, translations }: HoursViewProps) {
    if (!result.success && result.error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
            </Alert>
        )
    }

    if (!result.success || !result.data) {
        return null
    }

    const { summary, days } = result.data
    const hasWarnings = result.validationWarnings && result.validationWarnings.length > 0

    return (
        <div className="space-y-6">
            {hasWarnings && (
                <Alert
                    variant="default"
                    className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                >
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                        HTML Structure Warning
                    </AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                        <p className="mb-2">
                            The HTML structure from urnik.net may have changed. Please review:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                            {result.validationWarnings?.map((warning, idx) => (
                                <li key={idx}>
                                    <span className="font-semibold">{warning.field}:</span>{" "}
                                    {warning.message}
                                </li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                <div>
                    <div className="text-sm font-medium text-muted-foreground">
                        {translations.summary.billingHours}
                    </div>
                    <div className="text-2xl font-bold">{summary.billingHours || "—"}</div>
                </div>
                <div>
                    <div className="text-sm font-medium text-muted-foreground">
                        {translations.summary.plannedHours}
                    </div>
                    <div className="text-2xl font-bold">{summary.plannedHours || "—"}</div>
                </div>
                <div>
                    <div className="text-sm font-medium text-muted-foreground">
                        {translations.summary.balance}
                    </div>
                    <div className="text-2xl font-bold">{summary.balance || "—"}</div>
                </div>
                <div>
                    <div className="text-sm font-medium text-muted-foreground">
                        {translations.summary.hoursInDay}
                    </div>
                    <div className="text-2xl font-bold">{summary.hoursInDay || "—"}</div>
                </div>
                <div>
                    <div className="text-sm font-medium text-muted-foreground">
                        {translations.summary.workDays}
                    </div>
                    <div className="text-lg">{summary.workDays || "—"}</div>
                </div>
                <div>
                    <div className="text-sm font-medium text-muted-foreground">
                        {translations.summary.holidays}
                    </div>
                    <div className="text-lg">{summary.holidays || "—"}</div>
                </div>
                <div>
                    <div className="text-sm font-medium text-muted-foreground">
                        {translations.summary.lunches}
                    </div>
                    <div className="text-lg">{summary.lunches || "—"}</div>
                </div>
                <div>
                    <div className="text-sm font-medium text-muted-foreground">
                        {translations.summary.vacationBalance}
                    </div>
                    <div className="text-lg">{summary.vacationBalance || "—"}</div>
                </div>
                <div>
                    <div className="text-sm font-medium text-muted-foreground">
                        {translations.summary.sickLeave}
                    </div>
                    <div className="text-lg">{summary.sickLeave || "—"}</div>
                </div>
                <div>
                    <div className="text-sm font-medium text-muted-foreground">
                        {translations.summary.leaveDays}
                    </div>
                    <div className="text-lg">{summary.leaveDays || "—"}</div>
                </div>
                <div>
                    <div className="text-sm font-medium text-muted-foreground">
                        {translations.summary.workFromHome}
                    </div>
                    <div className="text-lg">{summary.workFromHome || "—"}</div>
                </div>
                <div>
                    <div className="text-sm font-medium text-muted-foreground">
                        {translations.summary.userType}
                    </div>
                    <div className="text-lg">{summary.userType || "—"}</div>
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">{translations.table.no}</TableHead>
                            <TableHead>{translations.table.date}</TableHead>
                            <TableHead>{translations.table.day}</TableHead>
                            <TableHead>{translations.table.status}</TableHead>
                            <TableHead className="text-right">
                                {translations.table.clockIn}
                            </TableHead>
                            <TableHead className="text-right">
                                {translations.table.clockOut}
                            </TableHead>
                            <TableHead className="text-right">
                                {translations.table.attendance}
                            </TableHead>
                            <TableHead className="text-right">
                                {translations.table.accounted}
                            </TableHead>
                            <TableHead className="text-right">
                                {translations.table.dayBalance}
                            </TableHead>
                            <TableHead className="text-right">
                                {translations.table.balanceMonth}
                            </TableHead>
                            <TableHead className="text-right">
                                {translations.table.balanceYear}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {days.map((day) => (
                            <TableRow key={day.number}>
                                <TableCell className="font-medium">{day.number}</TableCell>
                                <TableCell>{day.date}</TableCell>
                                <TableCell>{day.dayOfWeek}</TableCell>
                                <TableCell>{day.status}</TableCell>
                                <TableCell className="text-right">{day.clockIn || "—"}</TableCell>
                                <TableCell className="text-right">{day.clockOut || "—"}</TableCell>
                                <TableCell className="text-right">
                                    {day.attendance || "—"}
                                </TableCell>
                                <TableCell className="text-right">{day.accounted || "—"}</TableCell>
                                <TableCell className="text-right">
                                    {day.dayBalance || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                    {day.balanceMonth || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                    {day.balanceYear || "—"}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
