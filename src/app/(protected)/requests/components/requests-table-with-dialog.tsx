"use client"

import { useState } from "react"
import { RequestsTable } from "./requests-table"
import { RequestDetailForm } from "./request-detail-form"
import { type RequestDisplay } from "../schemas/request-schemas"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface RequestsTableWithDialogProps {
    requests: RequestDisplay[]
    showUser: boolean
    hasUrnikCredentials?: boolean
}

export function RequestsTableWithDialog({
    requests,
    showUser,
    hasUrnikCredentials = false,
}: RequestsTableWithDialogProps) {
    const [selectedRequest, setSelectedRequest] = useState<RequestDisplay | null>(null)
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)

    return (
        <>
            <RequestsTable
                requests={requests}
                showUser={showUser}
                onRequestClick={setSelectedRequest}
                onNewRequestClick={() => setIsNewRequestOpen(true)}
            />

            <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>New Request</DialogTitle>
                    </DialogHeader>
                    <RequestDetailForm
                        onSuccess={() => setIsNewRequestOpen(false)}
                        hasUrnikCredentials={hasUrnikCredentials}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Request Details</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <RequestDetailForm
                            request={selectedRequest}
                            onSuccess={() => setSelectedRequest(null)}
                            hasUrnikCredentials={hasUrnikCredentials}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
