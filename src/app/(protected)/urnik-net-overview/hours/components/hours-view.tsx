"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import type { ParsedHoursResult, DayEntry } from "../schemas/hours-schema"
import type { HoursViewTranslations } from "../types"
import { getPreviousMonthInt, getNextMonthInt } from "../../utils/date-helpers"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DayInfoDialog } from "./day-info-dialog"

interface HoursViewProps {
    result: ParsedHoursResult
    currentYear: number
    currentMonth: number
    monthName: string
    translations: HoursViewTranslations
}

export function HoursView({
    result,
    currentYear,
    currentMonth,
    monthName,
    translations,
}: HoursViewProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [selectedDay, setSelectedDay] = useState<DayEntry | null>(null)

    const { year: prevYear, month: prevMonth } = getPreviousMonthInt(currentYear, currentMonth)
    const { year: nextYear, month: nextMonth } = getNextMonthInt(currentYear, currentMonth)

    const handleMonthChange = (year: number, month: number) => {
        startTransition(() => {
            router.push(`?year=${year}&month=${month}`)
        })
    }

    if (!result.success && result.error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
            </Alert>
        )
    }

    const summary = result.success && result.data ? result.data.summary : null
    const days = result.success && result.data ? result.data.days : []
    const hasWarnings = result.validationWarnings && result.validationWarnings.length > 0

    return (
        <div className="flex flex-col gap-4 h-full">
            <div id="urnik-hours-nav" className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMonthChange(prevYear, prevMonth)}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-base sm:text-xl font-semibold min-w-0 text-center">
                        {monthName} {currentYear}
                    </h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMonthChange(nextYear, nextMonth)}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {summary && (
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-right hidden sm:block whitespace-nowrap">
                            <span className="text-muted-foreground">
                                {translations.summary.vacationBalanceShort}:{" "}
                            </span>
                            <span className="font-semibold">{summary.vacationBalance || "—"}</span>
                        </div>
                        <div className="text-sm text-right hidden sm:block whitespace-nowrap">
                            <span className="text-muted-foreground">
                                {translations.summary.balance}:{" "}
                            </span>
                            <span className="font-semibold">{summary.balance || "—"}</span>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button id="urnik-hours-details" variant="outline" size="sm">
                                    {translations.detailsButton}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        {monthName} {currentYear}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">
                                            {translations.summary.billingHours}
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {summary.billingHours || "—"}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">
                                            {translations.summary.plannedHours}
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {summary.plannedHours || "—"}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">
                                            {translations.summary.balance}
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {summary.balance || "—"}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">
                                            {translations.summary.hoursInDay}
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {summary.hoursInDay || "—"}
                                        </div>
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
                                        <div className="text-lg">
                                            {summary.vacationBalance || "—"}
                                        </div>
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
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

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

            {days.length > 0 && (
                <div className="flex-1 overflow-hidden relative">
                    <div id="urnik-hours-table" className="rounded-md border overflow-auto h-full">
                        <Table>
                            <TableHeader className="sticky top-0 z-30 bg-background">
                                <TableRow>
                                    <TableHead className="min-w-[50px]">
                                        {translations.table.no}
                                    </TableHead>
                                    <TableHead className="min-w-[100px]">
                                        {translations.table.date}
                                    </TableHead>
                                    <TableHead className="min-w-[80px]">
                                        {translations.table.day}
                                    </TableHead>
                                    <TableHead className="min-w-[120px]">
                                        {translations.table.status}
                                    </TableHead>
                                    <TableHead className="min-w-[60px]">
                                        {translations.table.graph}
                                    </TableHead>
                                    <TableHead className="text-right min-w-[80px]">
                                        {translations.table.clockIn}
                                    </TableHead>
                                    <TableHead className="text-right min-w-[80px]">
                                        {translations.table.clockOut}
                                    </TableHead>
                                    <TableHead className="text-right min-w-[90px]">
                                        {translations.table.attendance}
                                    </TableHead>
                                    <TableHead className="text-right min-w-[90px]">
                                        {translations.table.accounted}
                                    </TableHead>
                                    <TableHead className="text-right min-w-[90px]">
                                        {translations.table.dayBalance}
                                    </TableHead>
                                    <TableHead className="text-right min-w-[100px]">
                                        {translations.table.balanceMonth}
                                    </TableHead>
                                    <TableHead className="text-right min-w-[90px]">
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
                                        <TableCell>
                                            {day.graphColors ? (
                                                <div
                                                    className="cursor-pointer inline-flex items-center gap-[1px]"
                                                    onClick={() => setSelectedDay(day)}
                                                >
                                                    {day.graphColors.map((color, i) => {
                                                        const isWhite =
                                                            /^#(fff|ffffff)$/i.test(color) ||
                                                            color === "white"
                                                        return (
                                                            <span
                                                                key={i}
                                                                className={`inline-block h-2 w-[5px] ${isWhite ? "border border-gray-300 dark:border-gray-500" : ""}`}
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                "—"
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {day.clockIn || "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {day.clockOut || "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {day.attendance || "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {day.accounted || "—"}
                                        </TableCell>
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
                    {isPending && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                </div>
            )}
            <DayInfoDialog
                open={selectedDay !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedDay(null)
                    }
                }}
                date={selectedDay?.date ?? ""}
                dayOfWeek={selectedDay?.dayOfWeek ?? ""}
                graphColors={selectedDay?.graphColors ?? null}
                translations={translations.dayInfoDialog}
            />
        </div>
    )
}
