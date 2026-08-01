import { getTranslations } from "next-intl/server"
import { RequestHistoryTableClient } from "./request-history-table"
import type { RequestDisplay } from "../types"

interface RequestHistoryTableProps {
    requests: RequestDisplay[]
    holidays: Array<{ date: Date; name: string }>
    locale: string
}

export async function RequestHistoryTable({
    requests,
    holidays,
    locale,
}: RequestHistoryTableProps) {
    const [tTable, tCancel, tPagination, tFilter, tTypes, tStatuses] = await Promise.all([
        getTranslations("admin.requestHistory.table"),
        getTranslations("admin.requestHistory.cancel"),
        getTranslations("admin.requestHistory.pagination"),
        getTranslations("admin.requestHistory.filter"),
        getTranslations("requests.types"),
        getTranslations("requests.statuses"),
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
            cancelSuccess: tTable("cancelSuccess"),
            cancelError: tTable("cancelError"),
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
            rowsPerPage: tPagination("rowsPerPage"),
            pageOf: tPagination.raw("pageOf") as string,
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
        statuses: {
            approved: tStatuses("approved"),
            rejected: tStatuses("rejected"),
            cancelled: tStatuses("cancelled"),
        },
    }

    return (
        <RequestHistoryTableClient
            requests={requests}
            holidays={holidays}
            translations={translations}
            locale={locale}
        />
    )
}
