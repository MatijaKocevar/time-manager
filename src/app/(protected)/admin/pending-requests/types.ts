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
        other: string
    }
}
