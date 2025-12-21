import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { REQUEST_STATUS_CONFIGS } from "../constants"

interface RequestStatusBreakdownProps {
    statusCounts: {
        PENDING: number
        APPROVED: number
        REJECTED: number
        CANCELLED: number
    }
    translations: {
        title: string
        description: string
        pending: string
        approved: string
        rejected: string
        cancelled: string
    }
}

export function RequestStatusBreakdown({
    statusCounts,
    translations,
}: RequestStatusBreakdownProps) {
    return (
        <Card>
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
