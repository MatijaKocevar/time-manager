"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Table, TableBody } from "@/components/ui/table"
import type { PendingUrnikNetRequest } from "../schemas/urnik-net-requests-schemas"
import { submitPendingUrnikNetRequestToUrnik } from "../actions/urnik-net-requests-actions"
import { buildExistingRequestDates, mergeAndSortRows } from "../utils/request-row-helpers"
import {
    formatMonthLabel,
    getPreviousMonth,
    getNextMonth,
} from "../../utils/month-navigation-helpers"
import { CreateRequestButton } from "./create-request-button"
import { RequestsTableHeader } from "./requests-table-header"
import { PendingRequestRow } from "./pending-request-row"
import { SubmittedRequestRow } from "./submitted-request-row"
import type { UrnikNetRequestsViewProps } from "../types/urnik-net-requests-view-types"

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

    const isConnected = !!user.lastUrnikTestAt
    const lastTestedText = user.lastUrnikTestAt
        ? new Date(user.lastUrnikTestAt).toLocaleString()
        : null

    const urnikNetRequests = requestsResult?.data || []
    const pendingUrnikNetRequests = pendingRequestsResult?.data || []
    const error = requestsResult?.error || null
    const structureChanged = requestsResult?.structureChanged || false

    const handleMonthChange = (newMonth: string) => {
        startTransition(() => {
            router.push(`?month=${newMonth}`)
        })
    }

    const handleSubmit = async (request: PendingUrnikNetRequest) => {
        const requestKey = request.date.toISOString()
        setSubmittingIds((prev) => new Set(prev).add(requestKey))
        try {
            const result = await submitPendingUrnikNetRequestToUrnik(request)
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
        } catch (err) {
            toast.error("Failed to submit request", {
                description: err instanceof Error ? err.message : "Unknown error",
            })
        } finally {
            setSubmittingIds((prev) => {
                const next = new Set(prev)
                next.delete(requestKey)
                return next
            })
        }
    }

    const existingDates = buildExistingRequestDates(urnikNetRequests)
    const allRows = mergeAndSortRows(pendingUrnikNetRequests, urnikNetRequests, existingDates)

    const pendingRowTranslations = {
        pendingRequest: t.pendingRequest,
        inOffice: t.inOffice,
        remote: t.remote,
        calculatedFrom: t.calculatedFrom,
        autoCalculated: t.table.autoCalculated,
        submitButton: t.submitButton,
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <div id="urnik-requests-nav" className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMonthChange(getPreviousMonth(currentMonth))}
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
                        onClick={() => handleMonthChange(getNextMonth(currentMonth))}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <CreateRequestButton
                        label={t.createRequestButton}
                        hoursLabel={t.hoursLabel}
                        daysLabel={t.daysLabel}
                        typeWork={t.typeWork}
                        typeWorkFromHome={t.typeWorkFromHome}
                        typeVacation={t.typeVacation}
                        typeSickLeave={t.typeSickLeave}
                        typeDayWorkFromHome={t.typeDayWorkFromHome}
                    />
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
            </div>

            {structureChanged && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t.structureChanged}</AlertTitle>
                    <AlertDescription>{t.structureChangedDescription}</AlertDescription>
                </Alert>
            )}

            {error && !structureChanged && <p className="text-red-600">Error: {error}</p>}

            {allRows.length > 0 && (
                <div className="flex-1 overflow-hidden relative">
                    <div
                        id="urnik-requests-table"
                        className="rounded-md border overflow-auto h-full"
                    >
                        <Table>
                            <RequestsTableHeader {...t.table} />
                            <TableBody>
                                {allRows.map((row, idx) =>
                                    row.type === "pending" ? (
                                        <PendingRequestRow
                                            key={`pending-${row.data.date.toISOString()}`}
                                            request={row.data}
                                            isSubmitting={submittingIds.has(
                                                row.data.date.toISOString()
                                            )}
                                            onSubmit={() => handleSubmit(row.data)}
                                            translations={pendingRowTranslations}
                                        />
                                    ) : (
                                        <SubmittedRequestRow
                                            key={`existing-${row.data.no}-${idx}`}
                                            request={row.data}
                                            index={idx}
                                        />
                                    )
                                )}
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
