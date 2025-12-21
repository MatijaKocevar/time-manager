import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { authConfig } from "@/lib/auth"
import { getAllRequests } from "../../requests/actions/request-actions"
import { getHolidays } from "../holidays/actions/holiday-actions"
import { PendingRequestsTable } from "./components/pending-requests-table"

export default async function PendingRequestsPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/")
    }

    const [tTable, tReject, tPagination, tFilter, tTypes] = await Promise.all([
        getTranslations("admin.pendingRequests.table"),
        getTranslations("admin.pendingRequests.reject"),
        getTranslations("admin.pendingRequests.pagination"),
        getTranslations("admin.pendingRequests.filter"),
        getTranslations("requests.types"),
    ])

    const translations = {
        table: {
            user: tTable("user"),
            type: tTable("type"),
            startDate: tTable("startDate"),
            endDate: tTable("endDate"),
            hours: tTable("hours"),
            days: tTable("days"),
            reason: tTable("reason"),
            actions: tTable("actions"),
            approve: tTable("approve"),
            reject: tTable("reject"),
            approving: tTable("approving"),
            rejecting: tTable("rejecting"),
            noPending: tTable("noPending"),
            searchPlaceholder: tTable("searchPlaceholder"),
        },
        reject: {
            title: tReject("title"),
            confirmQuestion: tReject("confirmQuestion"),
            user: tReject("user"),
            type: tReject("type"),
            period: tReject("period"),
            reason: tReject("reason"),
            reasonRequired: tReject("reasonRequired"),
            reasonPlaceholder: tReject("reasonPlaceholder"),
            cancel: tReject("cancel"),
            rejecting: tReject("rejecting"),
            rejectRequest: tReject("rejectRequest"),
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
    }

    const [requests, holidaysResult] = await Promise.all([
        getAllRequests(["PENDING"]),
        getHolidays(),
    ])

    const requestsData = requests.map((r) => ({
        ...r,
        user: r.user ?? { name: null, email: "Unknown" },
    }))

    const holidays = (holidaysResult.success ? holidaysResult.data : []) ?? []

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex-1 min-h-0">
                <PendingRequestsTable
                    requests={requestsData}
                    holidays={holidays}
                    translations={translations}
                />
            </div>
        </div>
    )
}
