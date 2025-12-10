import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { getUserRequests } from "../actions/request-actions"
import { RequestDetailClient } from "../components/request-detail-client"

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function RequestDetailPage({ params }: PageProps) {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        notFound()
    }

    const { id } = await params

    const requests = await getUserRequests()
    const request = requests.find((r) => r.id === id)

    if (!request) {
        notFound()
    }

    return <RequestDetailClient request={request} />
}
