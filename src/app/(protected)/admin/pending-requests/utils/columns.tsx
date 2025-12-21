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
    isApproving: boolean
    isRejecting: boolean
    onApprove: (id: string) => void
    onReject: (id: string) => void
}

export function createColumns({
    translations,
    holidays,
    isApproving,
    isRejecting,
    onApprove,
    onReject,
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
            cell: ({ row }) => formatDate(row.original.startDate),
            enableColumnFilter: false,
        },
        {
            accessorKey: "endDate",
            header: translations.table.endDate,
            cell: ({ row }) => formatDate(row.original.endDate),
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
                return `${workdays * 8}h`
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
            cell: ({ row }) => (
                <div className="flex gap-2 justify-end w-[170px]">
                    <Button
                        size="sm"
                        onClick={() => onApprove(row.original.id)}
                        disabled={isApproving}
                        className="w-[84px]"
                    >
                        {isApproving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            translations.table.approve
                        )}
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onReject(row.original.id)}
                        disabled={isRejecting}
                        className="w-[76px]"
                    >
                        {translations.table.reject}
                    </Button>
                </div>
            ),
            enableColumnFilter: false,
            size: 170,
            minSize: 170,
            maxSize: 170,
        },
    ]
}
