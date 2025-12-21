export interface User {
    id: string
    name: string
    email: string
}

export interface Request {
    id: string
    type: string
    startDate: Date
    endDate: Date
    status: string
    user: {
        name: string
    }
}

export interface Holiday {
    id: string
    date: Date
    name: string
}

export interface OverviewTranslations {
    title: string
    stats: {
        users: string
        pendingRequests: string
        upcomingHolidays: string
        lists: string
    }
    statusBreakdown: {
        title: string
        description: string
        pending: string
        approved: string
        rejected: string
        cancelled: string
    }
    quickActions: {
        title: string
        description: string
        manageUsers: string
        viewPendingRequests: string
        manageShifts: string
        viewRequestHistory: string
    }
    recentPendingRequests: {
        title: string
        description: string
        viewAll: (params: { count: number }) => string
        user: string
        type: string
        period: string
    }
    upcomingHolidays: {
        title: string
        description: string
        viewAll: (params: { count: number }) => string
    }
}
