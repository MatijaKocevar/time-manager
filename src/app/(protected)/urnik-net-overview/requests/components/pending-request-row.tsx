import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { Send, Loader2 } from "lucide-react"
import type { PendingUrnikNetRequest } from "../schemas/urnik-net-requests-schemas"

interface PendingRequestRowProps {
    request: PendingUrnikNetRequest
    isSubmitting: boolean
    onSubmit: () => void
    translations: {
        pendingRequest: string
        inOffice: string
        remote: string
        calculatedFrom: string
        autoCalculated: string
        submitButton: string
    }
}

export function PendingRequestRow({
    request,
    isSubmitting,
    onSubmit,
    translations: t,
}: PendingRequestRowProps) {
    return (
        <TableRow className="bg-blue-50 dark:bg-blue-950/20">
            <TableCell>
                <Badge variant="secondary" className="text-xs">
                    {t.pendingRequest}
                </Badge>
            </TableCell>
            <TableCell>{request.date.toLocaleDateString("en-GB")}</TableCell>
            <TableCell>
                <Badge variant={request.type === "WORK" ? "default" : "outline"}>
                    {request.type === "WORK" ? t.inOffice : t.remote}
                </Badge>
            </TableCell>
            <TableCell>
                {String(request.date.getDate()).padStart(2, "0")}.
                {String(request.date.getMonth() + 1).padStart(2, "0")}.{request.date.getFullYear()}
            </TableCell>
            <TableCell className="text-right">1</TableCell>
            <TableCell className="text-right">{request.hours.toFixed(2)}</TableCell>
            <TableCell>{request.startTime}</TableCell>
            <TableCell>{request.endTime}</TableCell>
            <TableCell className="text-center">
                <span className="text-muted-foreground italic text-xs">{t.calculatedFrom}</span>
            </TableCell>
            <TableCell>-</TableCell>
            <TableCell className="text-xs text-muted-foreground">{t.autoCalculated}</TableCell>
            <TableCell>
                <Button size="sm" variant="outline" onClick={onSubmit} disabled={isSubmitting}>
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
}
