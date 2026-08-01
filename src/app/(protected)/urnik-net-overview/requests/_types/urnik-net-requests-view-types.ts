import type { UrnikNetRequest } from "../_utils/request-row-helpers"

export interface UrnikNetRequestsViewUser {
    id: string
    name: string | null
    email: string
    role: string
    isDemo: boolean
    urnikUsername: string | null
    lastUrnikTestAt: Date | null
}

export interface SubmittedUrnikNetRequest {
    id: string
    date: Date
    startTime: string | null
    endTime: string | null
    hours: number | null
    type: string
    urnikType: number | null
    status: string
    submittedAt: Date
    confirmedAt: Date | null
    errorMessage: string | null
    urnikRequestNo: string | null
}

export interface UrnikNetRequestsViewTranslations {
    pageTitle: string
    noCredentials: string
    goToProfile: string
    connectionStatus: string
    connected: string
    notConnected: string
    lastTested: string
    previousMonth: string
    nextMonth: string
    createRequestButton: string
    hoursLabel: string
    daysLabel: string
    typeWork: string
    typeWorkFromHome: string
    typeVacation: string
    typeSickLeave: string
    typeDayWorkFromHome: string
    table: {
        no: string
        requestDate: string
        requestType: string
        period: string
        days: string
        hours: string
        arrival: string
        departure: string
        status: string
        confirmedBy: string
        notes: string
        action: string
    }
    structureChanged: string
    structureChangedDescription: string
    noRequestsThisMonth: string
}

export interface UrnikNetRequestsViewProps {
    user: UrnikNetRequestsViewUser
    translations: UrnikNetRequestsViewTranslations
    requestsResult: {
        success: boolean
        data?: UrnikNetRequest[]
        error?: string
        structureChanged?: boolean
    } | null
    submittedRequests: SubmittedUrnikNetRequest[]
    currentMonth: string
}
