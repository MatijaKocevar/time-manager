import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RequestsTableWithDialog } from "@/app/(protected)/requests/_components/requests-table-with-dialog"
import type { RequestDisplay } from "@/app/(protected)/requests/_schemas/request-schemas"

interface RequestsCardProps {
    requests: RequestDisplay[]
}

export async function RequestsCard({ requests }: RequestsCardProps) {
    const t = await getTranslations("admin.users.detail")

    return (
        <Card id="user-requests">
            <CardHeader>
                <CardTitle>{t("requests")}</CardTitle>
                <CardDescription>{t("requestsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
                <RequestsTableWithDialog
                    requests={requests}
                    showUser={false}
                    showNewButton={false}
                />
            </CardContent>
        </Card>
    )
}
