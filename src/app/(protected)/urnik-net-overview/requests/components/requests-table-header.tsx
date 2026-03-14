import { TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface RequestsTableHeaderProps {
    no: string
    requestDate: string
    requestType: string
    period: string
    days: string
    hours: string
    arrival: string
    departure: string
    status: string
    confirmedBy: string
    notes: string
    action: string
}

export function RequestsTableHeader({
    no,
    requestDate,
    requestType,
    period,
    days,
    hours,
    arrival,
    departure,
    status,
    confirmedBy,
    notes,
    action,
}: RequestsTableHeaderProps) {
    return (
        <TableHeader className="sticky top-0 z-30 bg-background">
            <TableRow>
                <TableHead className="min-w-[60px]">{no}</TableHead>
                <TableHead className="min-w-[120px]">{requestDate}</TableHead>
                <TableHead className="min-w-[180px]">{requestType}</TableHead>
                <TableHead className="min-w-[120px]">{period}</TableHead>
                <TableHead className="text-right min-w-[80px]">{days}</TableHead>
                <TableHead className="text-right min-w-[80px]">{hours}</TableHead>
                <TableHead className="min-w-[100px]">{arrival}</TableHead>
                <TableHead className="min-w-[100px]">{departure}</TableHead>
                <TableHead className="text-center min-w-[120px]">{status}</TableHead>
                <TableHead className="min-w-[150px]">{confirmedBy}</TableHead>
                <TableHead className="min-w-[200px]">{notes}</TableHead>
                <TableHead className="min-w-[100px]">{action}</TableHead>
            </TableRow>
        </TableHeader>
    )
}
