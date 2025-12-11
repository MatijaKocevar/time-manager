import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface TableSkeletonProps {
    columns?: number
    rows?: number
    showHeader?: boolean
}

export function TableSkeleton({ columns = 5, rows = 8, showHeader = true }: TableSkeletonProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="rounded-md border">
                <Table>
                    {showHeader && (
                        <TableHeader>
                            <TableRow>
                                {Array.from({ length: columns }).map((_, i) => (
                                    <TableHead key={i}>
                                        <Skeleton className="h-4 w-full" />
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                    )}
                    <TableBody>
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {Array.from({ length: columns }).map((_, colIndex) => (
                                    <TableCell key={colIndex}>
                                        <Skeleton className="h-4 w-full" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
