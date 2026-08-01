import { TableCell, TableRow } from "@/components/ui/table"
import { getStatusColor } from "../_utils/request-row-helpers"
import type { UrnikNetRequest } from "../_utils/request-row-helpers"

interface SubmittedRequestRowProps {
    request: UrnikNetRequest
    index: number
}

export function SubmittedRequestRow({ request, index }: SubmittedRequestRowProps) {
    return (
        <TableRow key={`existing-${request.no}-${index}`}>
            <TableCell>{request.no}</TableCell>
            <TableCell>{request.requestDate}</TableCell>
            <TableCell>{request.requestType}</TableCell>
            <TableCell>{request.period}</TableCell>
            <TableCell className="text-right">{request.days}</TableCell>
            <TableCell className="text-right">{request.hours}</TableCell>
            <TableCell>{request.arrivalRequests}</TableCell>
            <TableCell>{request.departureRequests}</TableCell>
            <TableCell className="text-center">
                <span className={getStatusColor(request.status)}>{request.status}</span>
            </TableCell>
            <TableCell>{request.confirmedBy}</TableCell>
            <TableCell>{request.notes}</TableCell>
            <TableCell>-</TableCell>
        </TableRow>
    )
}
