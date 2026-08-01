import { getLocale } from "next-intl/server"
import { getAllRequests } from "@/app/(protected)/requests/_actions/request-actions"
import { syncRequestStatuses } from "@/app/(protected)/requests/_actions/sync-request-statuses"
import type { RequestDisplay } from "../_types/types"

export async function loadPendingRequestsData(): Promise<{
    requests: RequestDisplay[]
    locale: string
}> {
    await syncRequestStatuses()

    const [requests, locale] = await Promise.all([getAllRequests(["PENDING"]), getLocale()])

    const mappedRequests: RequestDisplay[] = requests.map((r) => ({
        ...r,
        user: r.user ?? { name: null, email: "Unknown" },
    }))

    return { requests: mappedRequests, locale }
}
