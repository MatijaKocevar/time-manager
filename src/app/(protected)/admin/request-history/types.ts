export interface RequestDisplay {
    id: string
    type: string
    startDate: Date
    endDate: Date
    reason: string | null
    location: string | null
    status: string
    user: {
        name: string | null
        email: string
    }
    approver?: {
        id: string
        name: string | null
        email: string
    } | null
    rejector?: {
        id: string
        name: string | null
        email: string
    } | null
    canceller?: {
        id: string
        name: string | null
        email: string
    } | null
    rejectionReason?: string | null
    cancellationReason?: string | null
    cancelledAt?: Date | null
}

export interface RequestHistoryTranslations {
    table: {
        user: string
        type: string
        startDate: string
        endDate: string
        hours: string
        days: string
        status: string
        processedBy: string
        reason: string
        actions: string
        noHistory: string
        searchPlaceholder: string
    }
    cancel: {
        title: string
        confirmQuestion: string
        markCancelled: string
        removeHours: string
        recalculate: string
        user: string
        type: string
        period: string
        reason: string
        reasonRequired: string
        reasonPlaceholder: string
        close: string
        cancelling: string
        cancelRequest: string
    }
    pagination: {
        previous: string
        next: string
    }
    filter: {
        title: string
        search: string
        clear: string
        apply: string
    }
    types: {
        vacation: string
        sickLeave: string
        workFromHome: string
        other: string
    }
    statuses: {
        approved: string
        rejected: string
        cancelled: string
    }
}
