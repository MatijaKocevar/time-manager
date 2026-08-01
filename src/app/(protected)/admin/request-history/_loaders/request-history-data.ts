import { getLocale } from "next-intl/server"
import { getAllRequests } from "@/app/(protected)/requests/_actions/request-actions"
import type { RequestDisplay } from "../_types/types"

export async function loadRequestHistoryData(): Promise<{
    requests: RequestDisplay[]
    locale: string
}> {
    const [requests, locale] = await Promise.all([
        getAllRequests(["APPROVED", "REJECTED", "CANCELLED"]),
        getLocale(),
    ])

    const mappedRequests: RequestDisplay[] = requests.map((r) => ({
        ...r,
        user: r.user ?? { name: null, email: "Unknown" },
    }))

    return { requests: mappedRequests, locale }
}
