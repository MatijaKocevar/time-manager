import { getTranslations } from "next-intl/server"
import { PendingRequestsTableClient } from "./pending-requests-table"
import type { RequestDisplay } from "../types"

interface PendingRequestsTableProps {
    requests: RequestDisplay[]
    holidays: Array<{ date: Date; name: string }>
    locale: string
}

export async function PendingRequestsTable({
    requests,
    holidays,
    locale,
}: PendingRequestsTableProps) {
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
            awaitingUrnikNet: tTable("awaitingUrnikNet"),
            approveSuccess: tTable("approveSuccess"),
            rejectSuccess: tTable("rejectSuccess"),
            approveError: tTable("approveError"),
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
        },
    }

    return (
        <PendingRequestsTableClient
            requests={requests}
            holidays={holidays}
            locale={locale}
            translations={translations}
        />
    )
}
