import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTranslations } from "next-intl/server"
import { REQUEST_STATUS_CONFIGS } from "../_constants"

interface RequestStatusBreakdownProps {
    statusCounts: {
        PENDING: number
        APPROVED: number
        REJECTED: number
        CANCELLED: number
    }
}

export async function RequestStatusBreakdown({ statusCounts }: RequestStatusBreakdownProps) {
    const [tAdmin, tRequests] = await Promise.all([
        getTranslations("admin.overview"),
        getTranslations("requests.statuses"),
    ])

    const translations = {
        title: tAdmin("requestStatusBreakdown"),
        description: tAdmin("requestStatusBreakdownDesc"),
        pending: tRequests("pending"),
        approved: tRequests("approved"),
        rejected: tRequests("rejected"),
        cancelled: tRequests("cancelled"),
    }
    return (
        <Card id="admin-status-breakdown">
            <CardHeader>
                <CardTitle>{translations.title}</CardTitle>
                <CardDescription>{translations.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {REQUEST_STATUS_CONFIGS.map(({ status, color }) => (
                        <div key={status} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`h-3 w-3 rounded-full ${color}`} />
                                <span className="text-sm font-medium">
                                    {
                                        translations[
                                            status.toLowerCase() as keyof typeof translations
                                        ]
                                    }
                                </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {statusCounts[status]}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
