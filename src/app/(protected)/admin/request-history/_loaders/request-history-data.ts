import { getLocale } from "next-intl/server"
import { getAllRequests } from "../../../requests/_actions/request-actions"
import { getHolidays } from "../../holidays/_actions/holiday-actions"
import type { RequestDisplay } from "../types"

export async function loadRequestHistoryData(): Promise<{
    requests: RequestDisplay[]
    holidays: Array<{ date: Date; name: string }>
    locale: string
}> {
    const [requests, holidaysResult, locale] = await Promise.all([
        getAllRequests(["APPROVED", "REJECTED", "CANCELLED"]),
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
