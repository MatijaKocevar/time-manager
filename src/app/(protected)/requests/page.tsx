import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserRequests } from "./actions/request-actions"
import { RequestsTableWithDialog } from "./components/requests-table-with-dialog"
import { syncRequestStatuses } from "./actions/sync-request-statuses"

export default async function RequestsPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return null
    }

    if (session.user.role === "ADMIN") {
        await syncRequestStatuses()
    }

    const [requests, userRecord] = await Promise.all([
        getUserRequests(),
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: { urnikUsername: true },
        }),
    ])

    const hasUrnikCredentials = !!userRecord?.urnikUsername

    return (
        <div className="flex flex-col gap-4 min-w-0 h-full">
            <RequestsTableWithDialog
                requests={requests}
                showUser={false}
                hasUrnikCredentials={hasUrnikCredentials}
            />
        </div>
    )
}
