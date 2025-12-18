import { getServerSession } from "next-auth"
import { getTranslations } from "next-intl/server"
import { authConfig } from "@/lib/auth"
import { getUserRequests } from "./actions/request-actions"
import { RequestsTableWithDialog } from "./components/requests-table-with-dialog"
import { SetBreadcrumbData } from "@/features/breadcrumbs/set-breadcrumb-data"

export default async function RequestsPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return null
    }

    const [requests, t] = await Promise.all([
        getUserRequests(),
        getTranslations("navigation"),
    ])

    return (
        <>
            <SetBreadcrumbData data={{ "/requests": t("requests") }} />
            <div className="flex flex-col gap-4 min-w-0 h-full">
                <RequestsTableWithDialog requests={requests} showUser={false} />
            </div>
        </>
    )
}
