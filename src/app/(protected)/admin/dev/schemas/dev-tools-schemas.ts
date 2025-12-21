export interface DevToolsClientProps {
    translations: {
        testEmail: {
            title: string
            description: string
            recipientLabel: string
            recipientPlaceholder: string
            button: string
        }
        testPush: {
            title: string
            description: string
            userIdLabel: string
            userIdPlaceholder: string
            button: string
        }
        testAdminPush: {
            title: string
            description: string
            button: string
        }
        simulateFlow: {
            title: string
            description: string
            userEmailLabel: string
            userEmailPlaceholder: string
            button: string
        }
        subscriptions: {
            title: string
            description: string
            button: string
            subscriptionText: string
            table: {
                user: string
                email: string
                role: string
                created: string
            }
        }
        results: {
            admins: string
        }
        loading: string
    }
}

export type ActionResult = {
    success: boolean
    message?: string
    error?: string
    sent?: number
    admins?: Array<{ name: string; email: string }>
    steps?: string[]
    subscriptions?: Array<{
        id: string
        userId: string
        userName: string
        userEmail: string
        userRole: string
        endpoint: string
        createdAt: string
    }>
    count?: number
}
