import { getLocale } from "next-intl/server"
import { getAllRequests } from "../../../requests/actions/request-actions"
import { getHolidays } from "../../holidays/actions/holiday-actions"
import { syncRequestStatuses } from "../../../requests/actions/sync-request-statuses"
import type { RequestDisplay } from "../types"

export async function loadPendingRequestsData(): Promise<{
    requests: RequestDisplay[]
    holidays: Array<{ date: Date; name: string }>
    locale: string
}> {
    await syncRequestStatuses()

    const [requests, holidaysResult, locale] = await Promise.all([
        getAllRequests(["PENDING"]),
        getHolidays(),
        getLocale(),
    ])

    const mappedRequests: RequestDisplay[] = requests.map((r) => ({
        ...r,
        user: r.user ?? { name: null, email: "Unknown" },
    }))

    const holidays = (holidaysResult.success ? holidaysResult.data : []) ?? []

    return { requests: mappedRequests, holidays, locale }
}
