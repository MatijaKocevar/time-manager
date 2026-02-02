"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { PendingUrnikRequest } from "../schemas/pending-request-schemas"
import { submitPendingRequestToUrnik } from "../actions/urnik-actions"

interface UrnikRequest {
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

interface SubmittedRequest {
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

interface UrnikSyncViewProps {
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
    }
    requestsResult: {
        success: boolean
        data?: UrnikRequest[]
        error?: string
        structureChanged?: boolean
    } | null
    pendingRequestsResult: {
        success: boolean
        data?: PendingUrnikRequest[]
        error?: string
    } | null
    submittedRequests: SubmittedRequest[]
}

export function UrnikSyncView({
    user,
    translations: t,
    requestsResult,
    pendingRequestsResult,
    submittedRequests,
}: UrnikSyncViewProps) {
    const router = useRouter()
    const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set())

    const hasCredentials = !!user.urnikUsername
    const isConnected = !!user.lastUrnikTestAt
    const lastTestedText = user.lastUrnikTestAt
        ? new Date(user.lastUrnikTestAt).toLocaleString()
        : null

    const requests = requestsResult?.data || []
    const pendingRequests = pendingRequestsResult?.data || []
    const error = requestsResult?.error || null
    const structureChanged = requestsResult?.structureChanged || false

    const handleSubmit = async (pendingRequest: PendingUrnikRequest) => {
        const requestKey = pendingRequest.date.toISOString()
        setSubmittingIds((prev) => new Set(prev).add(requestKey))

        try {
            const result = await submitPendingRequestToUrnik(pendingRequest)

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
    for (const req of requests) {
        try {
            const periodMatch = req.period.match(/(\d{2})\.(\d{2})\.(\d{4})/)
            if (periodMatch) {
                const [, day, month, year] = periodMatch
                const dateStr = `${year}-${month}-${day}`
                existingRequestDates.add(dateStr)
            }
        } catch {
            // Skip invalid period formats
        }
    }

    const filteredPendingRequests = pendingRequests.filter((pr) => {
        const year = pr.date.getFullYear()
        const month = String(pr.date.getMonth() + 1).padStart(2, "0")
        const day = String(pr.date.getDate()).padStart(2, "0")
        const dateStr = `${year}-${month}-${day}`
        return !existingRequestDates.has(dateStr)
    })

    const allRows = [
        ...filteredPendingRequests.map((pr) => ({
            type: "pending" as const,
            data: pr,
        })),
        ...requests.map((req) => ({
            type: "existing" as const,
            data: req,
        })),
    ]

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
            <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-muted-foreground">{t.connectionStatus}:</span>
                <Badge variant={isConnected ? "default" : "destructive"}>
                    {isConnected ? t.connected : t.notConnected}
                </Badge>
                {lastTestedText && (
                    <span className="text-sm text-muted-foreground">
                        ({t.lastTested}: {lastTestedText})
                    </span>
                )}
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
                <div className="flex-1 overflow-hidden">
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
                                        const pr = row.data
                                        const requestKey = pr.date.toISOString()
                                        const isSubmitting = submittingIds.has(requestKey)

                                        return (
                                            <TableRow
                                                key={`pending-${pr.date.toISOString()}`}
                                                className="bg-blue-50 dark:bg-blue-950/20"
                                            >
                                                <TableCell>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {t.pendingRequest}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {pr.date.toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            pr.type === "WORK"
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                    >
                                                        {pr.type === "WORK" ? t.inOffice : t.remote}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {pr.date.toLocaleDateString("en-GB")}
                                                </TableCell>
                                                <TableCell className="text-right">1</TableCell>
                                                <TableCell className="text-right">
                                                    {pr.hours.toFixed(2)}
                                                </TableCell>
                                                <TableCell>{pr.startTime}</TableCell>
                                                <TableCell>{pr.endTime}</TableCell>
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
                                                        onClick={() => handleSubmit(pr)}
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
                                        const req = row.data
                                        return (
                                            <TableRow key={`existing-${req.no}-${idx}`}>
                                                <TableCell>{req.no}</TableCell>
                                                <TableCell>{req.requestDate}</TableCell>
                                                <TableCell>{req.requestType}</TableCell>
                                                <TableCell>{req.period}</TableCell>
                                                <TableCell className="text-right">
                                                    {req.days}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {req.hours}
                                                </TableCell>
                                                <TableCell>{req.arrivalRequests}</TableCell>
                                                <TableCell>{req.departureRequests}</TableCell>
                                                <TableCell className="text-center">
                                                    <span
                                                        className={
                                                            req.status.includes("Confirmed")
                                                                ? "text-green-600"
                                                                : req.status.includes("Rejected")
                                                                  ? "text-red-600"
                                                                  : "text-muted-foreground"
                                                        }
                                                    >
                                                        {req.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{req.confirmedBy}</TableCell>
                                                <TableCell>{req.notes}</TableCell>
                                                <TableCell>-</TableCell>
                                            </TableRow>
                                        )
                                    }
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    )
}
