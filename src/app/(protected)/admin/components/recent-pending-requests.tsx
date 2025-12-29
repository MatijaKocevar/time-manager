import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WorkTypeBadge } from "@/components/work-type-badge"
import type { Request } from "../schemas"
import { formatRequestDateRange } from "../utils"
import type { WorkType } from "@/lib/work-type-styles"

interface RecentPendingRequestsProps {
    requests: Request[]
    locale: string
    totalPending: number
    translations: {
        title: string
        description: string
        viewAll: (params: { count: number }) => string
        user: string
        type: string
        period: string
    }
}

export function RecentPendingRequests({
    requests,
    locale,
    totalPending,
    translations,
}: RecentPendingRequestsProps) {
    if (requests.length === 0) {
        return null
    }

    const displayedRequests = requests.slice(0, 5)

    return (
        <Card>
            <CardHeader>
                <CardTitle>{translations.title}</CardTitle>
                <CardDescription>{translations.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {displayedRequests.map((request) => (
                        <div
                            key={request.id}
                            className="flex items-start justify-between space-x-4"
                        >
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {translations.user}: {request.user.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {translations.type}:{" "}
                                    <WorkTypeBadge type={request.type as WorkType}>
                                        {request.type.replace("_", " ")}
                                    </WorkTypeBadge>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {translations.period}:{" "}
                                    {formatRequestDateRange(
                                        request.startDate,
                                        request.endDate,
                                        locale
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                {totalPending > 5 && (
                    <Button variant="outline" className="w-full mt-4" asChild>
                        <Link href="/admin/pending-requests">
                            {translations.viewAll({ count: totalPending })}
                        </Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
