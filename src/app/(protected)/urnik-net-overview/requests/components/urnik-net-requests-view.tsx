"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Send, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { PendingUrnikNetRequest } from "../schemas/urnik-net-requests-schemas"
import { submitPendingUrnikNetRequestToUrnik } from "../actions/urnik-net-requests-actions"

interface UrnikNetRequest {
    no: string
    requestDate: string
    requestType: string
    period: string
    days: string
    hours: string
    pPrihod: string
    arrival: string
    arrivalRequests: string
    pOdhod: string
    departure: string
    departureRequests: string
    oldSchedule: string
    newSchedule: string
    status: string
    confirmedBy: string
    notes: string
    hasActions: boolean
}

interface User {
    id: string
    name: string | null
    email: string
    role: string
    isDemo: boolean
    urnikUsername: string | null
    lastUrnikTestAt: Date | null
}

interface SubmittedUrnikNetRequest {
    id: string
    date: Date
    startTime: string
    endTime: string
    hours: number
    type: string
    urnikType: number
    status: string
    submittedAt: Date
    confirmedAt: Date | null
    errorMessage: string | null
    urnikRequestNo: string | null
}

interface UrnikNetRequestsViewProps {
    user: User
    translations: {
        pageTitle: string
        noCredentials: string
        goToProfile: string
        connectionStatus: string
        connected: string
        notConnected: string
        lastTested: string
        pendingRequest: string
        submitButton: string
        calculatedFrom: string
        inOffice: string
        remote: string
        previousMonth: string
        nextMonth: string
    }
    requestsResult: {
        success: boolean
        data?: UrnikNetRequest[]
        error?: string
        structureChanged?: boolean
    } | null
    pendingRequestsResult: {
        success: boolean
        data?: PendingUrnikNetRequest[]
        error?: string
    } | null
    submittedRequests: SubmittedUrnikNetRequest[]
    currentMonth: string
}

export function UrnikNetRequestsView({
    user,
    translations: t,
    requestsResult,
    pendingRequestsResult,
    currentMonth,
}: UrnikNetRequestsViewProps) {
    const router = useRouter()
    const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set())
    const [isPending, startTransition] = useTransition()

    const hasCredentials = !!user.urnikUsername
    const isConnected = !!user.lastUrnikTestAt
    const lastTestedText = user.lastUrnikTestAt
        ? new Date(user.lastUrnikTestAt).toLocaleString()
        : null

    const urnikNetRequests = requestsResult?.data || []
    const pendingUrnikNetRequests = pendingRequestsResult?.data || []
    const error = requestsResult?.error || null
    const structureChanged = requestsResult?.structureChanged || false

    const formatMonthLabel = (monthKey: string): string => {
        const [year, month] = monthKey.split("-")
        const date = new Date(parseInt(year), parseInt(month) - 1, 1)
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
        }).format(date)
    }

    const getPreviousMonth = (): string => {
        const [year, month] = currentMonth.split("-").map(Number)
        const date = new Date(year, month - 1, 1)
        date.setMonth(date.getMonth() - 1)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    }

    const getNextMonth = (): string => {
        const [year, month] = currentMonth.split("-").map(Number)
        const date = new Date(year, month - 1, 1)
        date.setMonth(date.getMonth() + 1)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    }

    const handleMonthChange = (newMonth: string) => {
        startTransition(() => {
            router.push(`?month=${newMonth}`)
        })
    }

    const handleSubmit = async (pendingUrnikNetRequest: PendingUrnikNetRequest) => {
        const requestKey = pendingUrnikNetRequest.date.toISOString()
        setSubmittingIds((prev) => new Set(prev).add(requestKey))

        try {
            const result = await submitPendingUrnikNetRequestToUrnik(pendingUrnikNetRequest)

            if (result.success) {
                toast.success("Request submitted to urnik.net", {
                    description: `Tracking ID: ${result.trackingId}`,
                })
                router.refresh()
            } else {
                toast.error("Failed to submit request", {
                    description: result.error || "Unknown error",
                })
            }
        } catch (error) {
            toast.error("Failed to submit request", {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        } finally {
            setSubmittingIds((prev) => {
                const next = new Set(prev)
                next.delete(requestKey)
                return next
            })
        }
    }

    const existingRequestDates = new Set<string>()
    for (const urnikNetReq of urnikNetRequests) {
        try {
            const statusLower = urnikNetReq.status.toLowerCase()
            const isCanceledOrRejected =
                statusLower.includes("cancel") || statusLower.includes("reject")

            if (isCanceledOrRejected) {
                continue
            }

            const hasHours =
                urnikNetReq.hours && urnikNetReq.hours.trim() !== "" && urnikNetReq.hours !== "0"
            const hasArrival = urnikNetReq.arrival && urnikNetReq.arrival.trim() !== ""
            const hasDeparture = urnikNetReq.departure && urnikNetReq.departure.trim() !== ""
            const isWorkTypeChangeOnly = !hasHours && !hasArrival && !hasDeparture

            if (isWorkTypeChangeOnly) {
                continue
            }

            const rangeMatch = urnikNetReq.period.match(
                /(\d{2})\.(\d{2})\.(\d{4})-(\d{2})\.(\d{2})\.(\d{4})/
            )
            if (rangeMatch) {
                const [, day1, month1, year1, day2, month2, year2] = rangeMatch
                const start = new Date(parseInt(year1), parseInt(month1) - 1, parseInt(day1))
                const end = new Date(parseInt(year2), parseInt(month2) - 1, parseInt(day2))
                const current = new Date(start)
                while (current <= end) {
                    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`
                    existingRequestDates.add(dateStr)
                    current.setDate(current.getDate() + 1)
                }
            } else {
                const singleMatch = urnikNetReq.period.match(/(\d{2})\.(\d{2})\.(\d{4})/)
                if (singleMatch) {
                    const [, day, month, year] = singleMatch
                    const dateStr = `${year}-${month}-${day}`
                    existingRequestDates.add(dateStr)
                }
            }
        } catch {
            // Skip invalid period formats
        }
    }

    const filteredPending = pendingUrnikNetRequests.filter((pendingUrnikNetReq) => {
        const year = pendingUrnikNetReq.date.getFullYear()
        const month = String(pendingUrnikNetReq.date.getMonth() + 1).padStart(2, "0")
        const day = String(pendingUrnikNetReq.date.getDate()).padStart(2, "0")
        const dateStr = `${year}-${month}-${day}`
        return !existingRequestDates.has(dateStr)
    })

    const allRows: Array<{
        type: "pending" | "existing"
        data: PendingUrnikNetRequest | UrnikNetRequest
    }> = [
        ...filteredPending.map((pendingUrnikNetReq) => ({
            type: "pending" as const,
            data: pendingUrnikNetReq,
        })),
        ...urnikNetRequests.map((urnikNetReq) => ({
            type: "existing" as const,
            data: urnikNetReq,
        })),
    ]

    allRows.sort((a, b) => {
        const getDate = (item: typeof a): Date => {
            if (item.type === "pending") {
                return (item.data as PendingUrnikNetRequest).date
            } else {
                const match = (item.data as UrnikNetRequest).period.match(/(\d{2})\.(\d{2})\.(\d{4})/)
                if (match) {
                    const [, day, month, year] = match
                    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                }
                return new Date(0)
            }
        }

        const dateA = getDate(a)
        const dateB = getDate(b)

        if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime()
        }

        if (a.type === "pending" && b.type === "existing") return -1
        if (a.type === "existing" && b.type === "pending") return 1
        return 0
    })

    if (!hasCredentials) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground mb-4">{t.noCredentials}</p>
                        <Button asChild>
                            <Link href="/profile">{t.goToProfile}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMonthChange(getPreviousMonth())}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-base sm:text-xl font-semibold min-w-0 text-center">
                        {formatMonthLabel(currentMonth)}
                    </h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMonthChange(getNextMonth())}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">
                        {t.connectionStatus}:
                    </span>
                    <Badge
                        variant={isConnected ? "default" : "destructive"}
                        className="text-xs py-0 h-5"
                    >
                        {isConnected ? t.connected : t.notConnected}
                    </Badge>
                    {lastTestedText && (
                        <span className="text-xs text-muted-foreground hidden lg:inline">
                            ({t.lastTested}: {lastTestedText})
                        </span>
                    )}
                </div>
            </div>

            {structureChanged && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>HTML Structure Changed</AlertTitle>
                    <AlertDescription>
                        The urnik.net page structure has changed. The parser needs to be updated to
                        match the new format. Please contact the developer.
                    </AlertDescription>
                </Alert>
            )}

            {error && !structureChanged && <p className="text-red-600">Error: {error}</p>}

            {allRows.length > 0 && (
                <div className="flex-1 overflow-hidden relative">
                    <div className="rounded-md border overflow-auto h-full">
                        <Table>
                            <TableHeader className="sticky top-0 z-30 bg-background">
                                <TableRow>
                                    <TableHead className="min-w-[60px]">No.</TableHead>
                                    <TableHead className="min-w-[120px]">Request date</TableHead>
                                    <TableHead className="min-w-[180px]">Request type</TableHead>
                                    <TableHead className="min-w-[120px]">Period</TableHead>
                                    <TableHead className="text-right min-w-[80px]">Days</TableHead>
                                    <TableHead className="text-right min-w-[80px]">Hours</TableHead>
                                    <TableHead className="min-w-[100px]">Arrival</TableHead>
                                    <TableHead className="min-w-[100px]">Departure</TableHead>
                                    <TableHead className="text-center min-w-[120px]">
                                        Status
                                    </TableHead>
                                    <TableHead className="min-w-[150px]">Confirmed by</TableHead>
                                    <TableHead className="min-w-[200px]">Notes</TableHead>
                                    <TableHead className="min-w-[100px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allRows.map((row, idx) => {
                                    if (row.type === "pending") {
                                        const pendingUrnikNetReq = row.data as PendingUrnikNetRequest
                                        const requestKey = pendingUrnikNetReq.date.toISOString()
                                        const isSubmitting = submittingIds.has(requestKey)

                                        return (
                                            <TableRow
                                                key={`pending-${pendingUrnikNetReq.date.toISOString()}`}
                                                className="bg-blue-50 dark:bg-blue-950/20"
                                            >
                                                <TableCell>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {t.pendingRequest}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {pendingUrnikNetReq.date.toLocaleDateString("en-GB")}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            pendingUrnikNetReq.type === "WORK"
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                    >
                                                        {pendingUrnikNetReq.type === "WORK"
                                                            ? t.inOffice
                                                            : t.remote}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {String(pendingUrnikNetReq.date.getDate()).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                    .
                                                    {String(
                                                        pendingUrnikNetReq.date.getMonth() + 1
                                                    ).padStart(2, "0")}
                                                    .{pendingUrnikNetReq.date.getFullYear()}
                                                </TableCell>
                                                <TableCell className="text-right">1</TableCell>
                                                <TableCell className="text-right">
                                                    {pendingUrnikNetReq.hours.toFixed(2)}
                                                </TableCell>
                                                <TableCell>{pendingUrnikNetReq.startTime}</TableCell>
                                                <TableCell>{pendingUrnikNetReq.endTime}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-muted-foreground italic text-xs">
                                                        {t.calculatedFrom}
                                                    </span>
                                                </TableCell>
                                                <TableCell>-</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    Auto-calculated from tracker
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleSubmit(pendingUrnikNetReq)}
                                                        disabled={isSubmitting}
                                                    >
                                                        {isSubmitting ? (
                                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                        ) : (
                                                            <Send className="h-4 w-4 mr-1" />
                                                        )}
                                                        {t.submitButton}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    } else {
                                        const urnikNetReq = row.data as UrnikNetRequest
                                        return (
                                            <TableRow key={`existing-${urnikNetReq.no}-${idx}`}>
                                                <TableCell>{urnikNetReq.no}</TableCell>
                                                <TableCell>{urnikNetReq.requestDate}</TableCell>
                                                <TableCell>{urnikNetReq.requestType}</TableCell>
                                                <TableCell>{urnikNetReq.period}</TableCell>
                                                <TableCell className="text-right">
                                                    {urnikNetReq.days}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {urnikNetReq.hours}
                                                </TableCell>
                                                <TableCell>{urnikNetReq.arrivalRequests}</TableCell>
                                                <TableCell>{urnikNetReq.departureRequests}</TableCell>
                                                <TableCell className="text-center">
                                                    <span
                                                        className={
                                                            urnikNetReq.status.includes("Confirmed") &&
                                                            !urnikNetReq.status.includes("cancel")
                                                                ? "text-green-600"
                                                                : urnikNetReq.status.includes(
                                                                        "Rejected"
                                                                    ) ||
                                                                    urnikNetReq.status.includes("cancel")
                                                                  ? "text-red-600"
                                                                  : "text-muted-foreground"
                                                        }
                                                    >
                                                        {urnikNetReq.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{urnikNetReq.confirmedBy}</TableCell>
                                                <TableCell>{urnikNetReq.notes}</TableCell>
                                                <TableCell>-</TableCell>
                                            </TableRow>
                                        )
                                    }
                                })}
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
        </div>
    )
}
