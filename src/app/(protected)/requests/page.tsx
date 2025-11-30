import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { getUserRequests, getAllRequests } from "./actions/request-actions"
import { RequestsTable } from "./components/requests-table"

export default async function RequestsPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return null
    }

    const isAdmin = session.user.role === "ADMIN"
    const requests = isAdmin ? await getAllRequests() : await getUserRequests()

    return (
        <div className="flex flex-col gap-4 min-w-0 h-full">
            <RequestsTable requests={requests} showUser={isAdmin} />
        </div>
    )
}
