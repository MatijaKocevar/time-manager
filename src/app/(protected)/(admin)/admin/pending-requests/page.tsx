import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authConfig } from "@/lib/auth"
import { getAllRequests } from "../../../requests/actions/request-actions"
import { PendingRequestsList } from "../components/pending-requests-list"

export default async function PendingRequestsPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/")
    }

    const requests = await getAllRequests(["PENDING"])

    const requestsData = requests.map((r) => ({
        ...r,
        user: r.user ?? { name: null, email: "Unknown" },
    }))

    return (
        <div className="flex flex-col gap-4 h-full">
            <h1 className="text-2xl font-bold">Pending Requests</h1>
            <div className="flex-1 min-h-0">
                <PendingRequestsList requests={requestsData} />
            </div>
        </div>
    )
}
