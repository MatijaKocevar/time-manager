import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WorkTypeBadge } from "@/components/work-type-badge"
import { getTranslations } from "next-intl/server"
import type { Request } from "../schemas"
import { formatRequestDateRange } from "../utils"
import type { WorkType } from "@/lib/work-type-styles"

interface RecentPendingRequestsProps {
    requests: Request[]
    locale: string
    totalPending: number
}

export async function RecentPendingRequests({
    requests,
    locale,
    totalPending,
}: RecentPendingRequestsProps) {
    const t = await getTranslations("admin.overview")

    const translations = {
        title: t("recentPendingRequests"),
        description: t("recentPendingRequestsDesc"),
        viewAll: (params: { count: number }) => t("viewAllPending", params),
        noPending: t("noPendingRequests"),
        user: t("user"),
        type: t("type"),
        period: t("period"),
    }
    if (requests.length === 0) {
        return (
            <Card id="admin-recent-requests">
                <CardHeader>
                    <CardTitle>{translations.title}</CardTitle>
                    <CardDescription>{translations.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{translations.noPending}</p>
                </CardContent>
            </Card>
        )
    }

    const displayedRequests = requests.slice(0, 5)

    return (
        <Card id="admin-recent-requests">
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
