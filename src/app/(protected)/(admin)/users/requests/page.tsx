import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authConfig } from "@/lib/auth"
import { getAllRequests } from "../../../requests/actions/request-actions"
import { PendingRequestsList } from "./components/pending-requests-list"

export default async function UsersRequestsPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/")
    }

    const requests = await getAllRequests()
    const pendingRequests = requests
        .filter((r) => r.status === "PENDING")
        .map((r) => ({
            ...r,
            user: r.user ?? { name: null, email: "Unknown" },
        }))

    return (
        <div className="flex flex-col gap-4 min-w-0 h-full">
            <PendingRequestsList requests={pendingRequests} />
        </div>
    )
}
