import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { getUserRequests } from "./actions/request-actions"
import { RequestsTableWithDialog } from "./components/requests-table-with-dialog"

export default async function RequestsPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return null
    }

    const requests = await getUserRequests()

    return (
        <div className="flex flex-col gap-4 min-w-0 h-full">
            <RequestsTableWithDialog requests={requests} showUser={false} />
        </div>
    )
}
