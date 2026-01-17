import { ColumnDef } from "@tanstack/react-table"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRequestTypeTranslationKey } from "../../../requests/utils/translation-helpers"
import type { RequestType } from "../../../requests/schemas/request-schemas"
import type { RequestDisplay, PendingRequestTranslations } from "../types"
import { TYPE_COLORS } from "../constants"
import { calculateWorkdays, formatDate } from "./helpers"

interface CreateColumnsParams {
    translations: PendingRequestTranslations
    holidays: Array<{ date: Date; name: string }>
    locale: string
    isApproving: boolean
    isRejecting: boolean
    approvingId: string | null
    requests: RequestDisplay[]
    onApprove: (id: string) => void
    onReject: (id: string) => void
}

export function createColumns({
    translations,
    holidays,
    locale,
    isApproving,
    isRejecting,
    approvingId,
    requests,
    onApprove,
    onReject,
}: CreateColumnsParams): ColumnDef<RequestDisplay>[] {
    const getTypeTranslation = (type: RequestType) => {
        const key = getRequestTypeTranslationKey(type)
        const typeMap: Record<string, string> = {
            vacation: translations.types.vacation,
            sickLeave: translations.types.sickLeave,
            workFromHome: translations.types.workFromHome,
        }
        return typeMap[key] || key
    }

    const hasEarlierPendingRequest = (request: RequestDisplay) => {
        return requests.some(
            (r) =>
                r.user.email === request.user.email &&
                r.status === "PENDING" &&
                r.createdAt < request.createdAt &&
                r.id !== request.id
        )
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
            cell: ({ row }) => {
                const date = formatDate(row.original.startDate, locale)
                return row.original.startTime ? `${date} ${row.original.startTime}` : date
            },
            enableColumnFilter: false,
        },
        {
            accessorKey: "endDate",
            header: translations.table.endDate,
            cell: ({ row }) => {
                const date = formatDate(row.original.endDate, locale)
                return row.original.endTime ? `${date} ${row.original.endTime}` : date
            },
            enableColumnFilter: false,
        },
        {
            id: "hours",
            header: translations.table.hours,
            cell: ({ row }) => {
                if (
                    row.original.requestedHours !== null &&
                    row.original.requestedHours !== undefined
                ) {
                    const totalHours = Number(row.original.requestedHours)
                    const hours = Math.floor(totalHours)
                    const minutes = Math.round((totalHours - hours) * 60)
                    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
                }
                return "-"
            },
            enableColumnFilter: false,
        },
        {
            accessorKey: "reason",
            header: translations.table.reason,
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">{row.original.reason || "-"}</div>
            ),
            enableColumnFilter: true,
            filterFn: "includesString",
        },
        {
            id: "actions",
            header: () => <div className="text-right w-[170px]">{translations.table.actions}</div>,
            cell: ({ row }) => {
                const isThisRowApproving = approvingId === row.original.id
                const hasEarlier = hasEarlierPendingRequest(row.original)
                return (
                    <div className="flex gap-2 justify-end w-[170px]">
                        <Button
                            size="sm"
                            onClick={() => onApprove(row.original.id)}
                            disabled={isApproving || isThisRowApproving || hasEarlier}
                            className="w-[84px]"
                            title={
                                hasEarlier
                                    ? "Earlier pending requests must be processed first"
                                    : undefined
                            }
                        >
                            {isThisRowApproving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                translations.table.approve
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onReject(row.original.id)}
                            disabled={isRejecting || isApproving || hasEarlier}
                            className="w-[76px]"
                            title={
                                hasEarlier
                                    ? "Earlier pending requests must be processed first"
                                    : undefined
                            }
                        >
                            {translations.table.reject}
                        </Button>
                    </div>
                )
            },
            enableColumnFilter: false,
            size: 170,
            minSize: 170,
            maxSize: 170,
        },
    ]
}
