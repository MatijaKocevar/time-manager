import { ColumnDef } from "@tanstack/react-table"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    getRequestTypeTranslationKey,
    getRequestStatusTranslationKey,
} from "../../../requests/utils/translation-helpers"
import type { RequestType, RequestStatus } from "../../../requests/schemas/request-schemas"
import type { RequestDisplay, RequestHistoryTranslations } from "../types"
import { TYPE_COLORS, STATUS_COLORS } from "../constants"
import { calculateWorkdays, formatDate } from "./helpers"

interface CreateColumnsParams {
    translations: RequestHistoryTranslations
    holidays: Array<{ date: Date; name: string }>
    locale: string
    onCancel: (
        requestId: string,
        userName: string,
        type: string,
        startDate: Date,
        endDate: Date
    ) => void
}

export function createColumns({
    translations,
    holidays,
    locale,
    onCancel,
}: CreateColumnsParams): ColumnDef<RequestDisplay>[] {
    const getTypeTranslation = (type: RequestType) => {
        const key = getRequestTypeTranslationKey(type)
        const typeMap: Record<string, string> = {
            vacation: translations.types.vacation,
            sickLeave: translations.types.sickLeave,
            workFromHome: translations.types.workFromHome,
            other: translations.types.other,
        }
        return typeMap[key] || key
    }

    const getStatusTranslation = (status: RequestStatus) => {
        const key = getRequestStatusTranslationKey(status)
        const statusMap: Record<string, string> = {
            approved: translations.statuses.approved,
            rejected: translations.statuses.rejected,
            cancelled: translations.statuses.cancelled,
        }
        return statusMap[key] || key
    }

    return [
        {
            id: "user",
            accessorFn: (row) => row.user.name || row.user.email,
            header: translations.table.user,
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.user.name || row.original.user.email}
                </div>
            ),
            enableColumnFilter: true,
            filterFn: "includesString",
        },
        {
            id: "type",
            accessorFn: (row) => getTypeTranslation(row.type as RequestType),
            header: translations.table.type,
            cell: ({ row }) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                        TYPE_COLORS[row.original.type]
                    }`}
                >
                    {getTypeTranslation(row.original.type as RequestType)}
                </span>
            ),
            enableColumnFilter: true,
            filterFn: "includesString",
        },
        {
            accessorKey: "startDate",
            header: translations.table.startDate,
            cell: ({ row }) => formatDate(row.original.startDate, locale),
            enableColumnFilter: false,
        },
        {
            accessorKey: "endDate",
            header: translations.table.endDate,
            cell: ({ row }) => formatDate(row.original.endDate, locale),
            enableColumnFilter: false,
        },
        {
            id: "hours",
            header: translations.table.hours,
            cell: ({ row }) => {
                const workdays = calculateWorkdays(
                    row.original.startDate,
                    row.original.endDate,
                    holidays
                )
                const hours = workdays * 8
                return (
                    <div className="font-semibold">
                        {hours}h ({workdays}
                        {translations.table.days})
                    </div>
                )
            },
            enableColumnFilter: false,
        },
        {
            accessorKey: "status",
            header: translations.table.status,
            cell: ({ row }) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_COLORS[row.original.status]
                    }`}
                >
                    {getStatusTranslation(row.original.status as RequestStatus)}
                </span>
            ),
            enableColumnFilter: true,
            filterFn: "includesString",
        },
        {
            id: "processedBy",
            accessorFn: (row) => {
                const processor = row.approver || row.rejector || row.canceller
                return processor?.name || processor?.email || "-"
            },
            header: translations.table.processedBy,
            cell: ({ row }) => {
                const processor =
                    row.original.approver || row.original.rejector || row.original.canceller
                return <div className="text-sm">{processor?.name || processor?.email || "-"}</div>
            },
            enableColumnFilter: true,
            filterFn: "includesString",
        },
        {
            accessorKey: "reason",
            header: translations.table.reason,
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    {row.original.cancellationReason ||
                        row.original.rejectionReason ||
                        row.original.reason ||
                        "-"}
                </div>
            ),
            enableColumnFilter: true,
            filterFn: "includesString",
        },
        {
            id: "actions",
            header: translations.table.actions,
            cell: ({ row }) => {
                if (row.original.status === "APPROVED") {
                    return (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                onCancel(
                                    row.original.id,
                                    row.original.user.name || row.original.user.email,
                                    getTypeTranslation(row.original.type as RequestType),
                                    row.original.startDate,
                                    row.original.endDate
                                )
                            }
                            className="h-8 w-8 p-0"
                            aria-label="Cancel request"
                        >
                            <X className="h-4 w-4 text-red-600" />
                        </Button>
                    )
                }
                return null
            },
            enableColumnFilter: false,
        },
    ]
}
