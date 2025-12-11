import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface CardSkeletonProps {
    rows?: number
    showHeader?: boolean
}

export function CardSkeleton({ rows = 5, showHeader = true }: CardSkeletonProps) {
    return (
        <Card>
            {showHeader && (
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
            )}
            <CardContent className="space-y-4">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
