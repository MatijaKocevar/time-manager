export interface RequestDisplay {
    id: string
    type: string
    startDate: Date
    endDate: Date
    startTime: string | null
    endTime: string | null
    isFullDay: boolean
    requestedHours: number | null
    reason: string | null
    location: string | null
    status: string
    createdAt: Date
    urnikNetSynced: boolean
    urnikNetStatus: string | null
    user: {
        name: string | null
        email: string
    }
}

export interface PendingRequestTranslations {
    table: {
        user: string
        type: string
        startDate: string
        endDate: string
        hours: string
        days: string
        reason: string
        actions: string
        approve: string
        reject: string
        approving: string
        rejecting: string
        noPending: string
        searchPlaceholder: string
        awaitingUrnikNet: string
        approveSuccess: string
        rejectSuccess: string
        approveError: string
    }
    reject: {
        title: string
        confirmQuestion: string
        user: string
        type: string
        period: string
        reason: string
        reasonRequired: string
        reasonPlaceholder: string
        cancel: string
        rejecting: string
        rejectRequest: string
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
    }
}
