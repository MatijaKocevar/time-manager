"use client"

import { useState } from "react"
import { RequestsTable } from "./requests-table"
import { RequestDetailDialog } from "./request-detail-dialog"
import { type RequestDisplay } from "../schemas/request-schemas"

interface RequestsTableWithDialogProps {
    requests: RequestDisplay[]
    showUser: boolean
}

export function RequestsTableWithDialog({ requests, showUser }: RequestsTableWithDialogProps) {
    const [selectedRequest, setSelectedRequest] = useState<RequestDisplay | null>(null)

    return (
        <>
            <RequestsTable
                requests={requests}
                showUser={showUser}
                onRequestClick={setSelectedRequest}
            />
            <RequestDetailDialog
                request={selectedRequest}
                open={!!selectedRequest}
                onOpenChange={(open) => !open && setSelectedRequest(null)}
            />
        </>
    )
}
