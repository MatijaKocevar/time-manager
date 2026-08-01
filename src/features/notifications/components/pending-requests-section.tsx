"use client"

import { Check, X, Loader2, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkTypeBadge } from "@/components/work-type-badge"
import { Separator } from "@/components/ui/separator"
import type { WorkType } from "@/lib/work-type-styles"
import type { PendingRequestNotification } from "../actions/notification-actions"

interface PendingRequestsSectionProps {
    pendingRequests: PendingRequestNotification[]
    processingId: string | null
    isAdmin: boolean
    isApproving: boolean
    isRejecting: boolean
    onApprove: (e: React.MouseEvent, requestId: string) => void
    onReject: (e: React.MouseEvent, requestId: string) => void
    translations: {
        requestTypes: {
            VACATION: string
            SICK_LEAVE: string
            WORK_FROM_HOME: string
        }
        approve?: string
        reject?: string
        awaitingUrnikNet?: string
        urnikSyncFailed?: string
    }
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    })
}

export function PendingRequestsSection({
    pendingRequests,
    processingId,
    isAdmin,
    isApproving,
    isRejecting,
    onApprove,
    onReject,
    translations,
}: PendingRequestsSectionProps) {
    return (
        <div className="py-2">
            {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No pending requests</p>
                </div>
            ) : (
                <>
                    {pendingRequests.map((request, index) => {
                        const isProcessing = processingId === request.id
                        return (
                            <div key={request.id}>
                                <div className="px-4 py-3 hover:bg-accent transition-colors">
                                    <div className="flex items-start gap-3">
                                        {isAdmin && (
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-sm font-semibold text-primary">
                                                    {request.userName
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase()
                                                        .slice(0, 2)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            {isAdmin && (
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="font-medium text-sm truncate">
                                                        {request.userName}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                                        {formatDate(request.createdAt)}
                                                    </span>
                                                </div>
                                            )}
                                            <p className="text-sm mb-1">
                                                <WorkTypeBadge type={request.type as WorkType}>
                                                    {translations.requestTypes[
                                                        request.type as keyof typeof translations.requestTypes
                                                    ] || request.type}
                                                </WorkTypeBadge>
                                                {request.urnikNetSynced && (
                                                    <span className="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 whitespace-nowrap">
                                                        Urnik.net
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                {formatDate(request.startDate)} -{" "}
                                                {formatDate(request.endDate)}
                                            </p>
                                            {isAdmin &&
                                                request.urnikNetSynced &&
                                                request.urnikNetStatus === "FAILED" && (
                                                    <p className="text-xs text-red-600 italic">
                                                        {translations.urnikSyncFailed ||
                                                            "Urnik.net submission failed"}
                                                    </p>
                                                )}
                                            {isAdmin &&
                                                request.urnikNetSynced &&
                                                request.urnikNetStatus !== "FAILED" && (
                                                    <p className="text-xs text-blue-600 italic">
                                                        {translations.awaitingUrnikNet ||
                                                            "Awaiting Urnik.net decision"}
                                                    </p>
                                                )}
                                            {isAdmin && !request.urnikNetSynced && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={(e) => onApprove(e, request.id)}
                                                        disabled={!!processingId}
                                                        className="h-7 px-3 text-xs"
                                                    >
                                                        {isProcessing && isApproving ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Check className="h-3 w-3 mr-1" />
                                                                {translations.approve || "Approve"}
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={(e) => onReject(e, request.id)}
                                                        disabled={!!processingId}
                                                        className="h-7 px-3 text-xs"
                                                    >
                                                        {isProcessing && isRejecting ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <X className="h-3 w-3 mr-1" />
                                                                {translations.reject || "Reject"}
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {index < pendingRequests.length - 1 && <Separator />}
                            </div>
                        )
                    })}
                </>
            )}
        </div>
    )
}
