"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Loader2, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react"
import { Table, TableBody } from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    formatMonthLabel,
    getPreviousMonth,
    getNextMonth,
} from "../../_utils/month-navigation-helpers"
import { useCreateRequestStore } from "../_stores/create-request-store"
import type { UrnikNetRequestType } from "../_schemas/create-urnik-net-request-schema"
import type { UrnikDayRequestType } from "../_schemas/create-urnik-net-day-request-schema"
import { RequestsTableHeader } from "./requests-table-header"
import { SubmittedRequestRow } from "./submitted-request-row"
import type { UrnikNetRequestsViewProps } from "../_types/urnik-net-requests-view-types"

export function UrnikNetRequestsView({
    user,
    translations: t,
    requestsResult,
    currentMonth,
}: UrnikNetRequestsViewProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const openDialog = useCreateRequestStore((state) => state.openDialog)
    const setSelectedType = useCreateRequestStore((state) => state.setSelectedType)
    const setRequestCategory = useCreateRequestStore((state) => state.setRequestCategory)

    const handleSelectHourType = (type: UrnikNetRequestType) => {
        setRequestCategory("HOUR")
        setSelectedType(type)
        openDialog()
    }

    const handleSelectDayType = (type: UrnikDayRequestType) => {
        setRequestCategory("DAY")
        setSelectedType(type)
        openDialog()
    }

    const isConnected = !!user.lastUrnikTestAt
    const lastTestedText = user.lastUrnikTestAt
        ? new Date(user.lastUrnikTestAt).toLocaleString()
        : null

    const urnikNetRequests = requestsResult?.data || []
    const error = requestsResult?.error || null
    const structureChanged = requestsResult?.structureChanged || false

    const handleMonthChange = (newMonth: string) => {
        startTransition(() => {
            router.push(`?month=${newMonth}`)
        })
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
                    <Badge
                        variant={isConnected ? "default" : "destructive"}
                        className="text-xs py-0 h-5"
                    >
                        {isConnected ? t.connected : t.notConnected}
                    </Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t.createRequestButton}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>{t.hoursLabel}</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => handleSelectHourType("WORK")}>
                                        {t.typeWork}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleSelectHourType("WORK_FROM_HOME")}
                                    >
                                        {t.typeWorkFromHome}
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>{t.daysLabel}</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem
                                        onClick={() => handleSelectDayType("VACATION")}
                                    >
                                        {t.typeVacation}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleSelectDayType("SICK_LEAVE")}
                                    >
                                        {t.typeSickLeave}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleSelectDayType("WORK_FROM_HOME")}
                                    >
                                        {t.typeDayWorkFromHome}
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        </DropdownMenuContent>
                    </DropdownMenu>
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

            {urnikNetRequests.length > 0 && (
                <div className="flex-1 overflow-hidden relative">
                    <div
                        id="urnik-requests-table"
                        className="rounded-md border overflow-auto h-full"
                    >
                        <Table>
                            <RequestsTableHeader {...t.table} />
                            <TableBody>
                                {urnikNetRequests.map((req, idx) => (
                                    <SubmittedRequestRow
                                        key={`existing-${req.no}-${idx}`}
                                        request={req}
                                        index={idx}
                                    />
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
        </div>
    )
}
