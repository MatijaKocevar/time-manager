import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { getTranslations, getLocale } from "next-intl/server"
import { authConfig } from "@/lib/auth"
import { getAllRequests } from "../../requests/actions/request-actions"
import { getHolidays } from "../holidays/actions/holiday-actions"
import { RequestHistoryTable } from "./components/request-history-table"

export default async function RequestHistoryPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/")
    }

    const [tTable, tCancel, tPagination, tFilter, tTypes, tStatuses, locale] = await Promise.all([
        getTranslations("admin.requestHistory.table"),
        getTranslations("admin.requestHistory.cancel"),
        getTranslations("admin.requestHistory.pagination"),
        getTranslations("admin.requestHistory.filter"),
        getTranslations("requests.types"),
        getTranslations("requests.statuses"),
        getLocale(),
    ])

    const translations = {
        table: {
            user: tTable("user"),
            type: tTable("type"),
            startDate: tTable("startDate"),
            endDate: tTable("endDate"),
            hours: tTable("hours"),
            days: tTable("days"),
            status: tTable("status"),
            processedBy: tTable("processedBy"),
            reason: tTable("reason"),
            actions: tTable("actions"),
            noHistory: tTable("noHistory"),
            searchPlaceholder: tTable("searchPlaceholder"),
        },
        cancel: {
            title: tCancel("title"),
            confirmQuestion: tCancel("confirmQuestion"),
            markCancelled: tCancel("markCancelled"),
            removeHours: tCancel("removeHours"),
            recalculate: tCancel("recalculate"),
            user: tCancel("user"),
            type: tCancel("type"),
            period: tCancel("period"),
            reason: tCancel("reason"),
            reasonRequired: tCancel("reasonRequired"),
            reasonPlaceholder: tCancel("reasonPlaceholder"),
            close: tCancel("close"),
            cancelling: tCancel("cancelling"),
            cancelRequest: tCancel("cancelRequest"),
        },
        pagination: {
            previous: tPagination("previous"),
            next: tPagination("next"),
        },
        filter: {
            title: tFilter("title"),
            search: tFilter("search"),
            clear: tFilter("clear"),
            apply: tFilter("apply"),
        },
        types: {
            vacation: tTypes("vacation"),
            sickLeave: tTypes("sickLeave"),
            workFromHome: tTypes("workFromHome"),
            other: tTypes("other"),
        },
        statuses: {
            approved: tStatuses("approved"),
            rejected: tStatuses("rejected"),
            cancelled: tStatuses("cancelled"),
        },
    }

    const [historyRequests, holidaysResult] = await Promise.all([
        getAllRequests(["APPROVED", "REJECTED", "CANCELLED"]),
        getHolidays(),
    ])

    const historyData = historyRequests.map((r) => ({
        ...r,
        user: r.user ?? { id: "unknown", name: null, email: "Unknown" },
    }))

    const holidays = (holidaysResult.success ? holidaysResult.data : []) ?? []

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex-1 min-h-0">
                <RequestHistoryTable
                    requests={historyData}
                    holidays={holidays}
                    translations={translations}
                    locale={locale}
                />
            </div>
        </div>
    )
}
