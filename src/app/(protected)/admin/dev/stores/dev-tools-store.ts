import { create } from "zustand"
import {
    testEmailAction,
    testPushAction,
    testPushToAdminsAction,
    simulateRequestFlowAction,
    listSubscriptionsAction,
} from "../actions/dev-actions"
import { type ActionResult } from "../schemas/dev-tools-schemas"

interface DevToolsState {
    emailInput: string
    userIdInput: string
    userEmailInput: string
    emailResult: ActionResult | null
    pushResult: ActionResult | null
    adminPushResult: ActionResult | null
    flowResult: ActionResult | null
    subscriptionsResult: ActionResult | null
    emailLoading: boolean
    pushLoading: boolean
    adminPushLoading: boolean
    flowLoading: boolean
    subscriptionsLoading: boolean
}

interface DevToolsActions {
    setEmailInput: (value: string) => void
    setUserIdInput: (value: string) => void
    setUserEmailInput: (value: string) => void
    setEmailResult: (result: ActionResult | null) => void
    setPushResult: (result: ActionResult | null) => void
    setAdminPushResult: (result: ActionResult | null) => void
    setFlowResult: (result: ActionResult | null) => void
    setSubscriptionsResult: (result: ActionResult | null) => void
    setEmailLoading: (loading: boolean) => void
    setPushLoading: (loading: boolean) => void
    setAdminPushLoading: (loading: boolean) => void
    setFlowLoading: (loading: boolean) => void
    setSubscriptionsLoading: (loading: boolean) => void
    handleTestEmail: () => Promise<void>
    handleTestPush: () => Promise<void>
    handleTestAdminPush: () => Promise<void>
    handleSimulateFlow: () => Promise<void>
    handleListSubscriptions: () => Promise<void>
}

export const useDevToolsStore = create<DevToolsState & DevToolsActions>((set, get) => ({
    emailInput: "",
    userIdInput: "",
    userEmailInput: "",
    emailResult: null,
    pushResult: null,
    adminPushResult: null,
    flowResult: null,
    subscriptionsResult: null,
    emailLoading: false,
    pushLoading: false,
    adminPushLoading: false,
    flowLoading: false,
    subscriptionsLoading: false,
    setEmailInput: (value) => set({ emailInput: value }),
    setUserIdInput: (value) => set({ userIdInput: value }),
    setUserEmailInput: (value) => set({ userEmailInput: value }),
    setEmailResult: (result) => set({ emailResult: result }),
    setPushResult: (result) => set({ pushResult: result }),
    setAdminPushResult: (result) => set({ adminPushResult: result }),
    setFlowResult: (result) => set({ flowResult: result }),
    setSubscriptionsResult: (result) => set({ subscriptionsResult: result }),
    setEmailLoading: (loading) => set({ emailLoading: loading }),
    setPushLoading: (loading) => set({ pushLoading: loading }),
    setAdminPushLoading: (loading) => set({ adminPushLoading: loading }),
    setFlowLoading: (loading) => set({ flowLoading: loading }),
    setSubscriptionsLoading: (loading) => set({ subscriptionsLoading: loading }),
    handleTestEmail: async () => {
        const emailInput = get().emailInput
        if (!emailInput) return
        set({ emailLoading: true, emailResult: null })
        try {
            const result = await testEmailAction(emailInput)
            set({ emailResult: result })
        } catch {
            set({ emailResult: { success: false, error: "Failed to send test email" } })
        } finally {
            set({ emailLoading: false })
        }
    },
    handleTestPush: async () => {
        const userIdInput = get().userIdInput
        if (!userIdInput) return
        set({ pushLoading: true, pushResult: null })
        try {
            const result = await testPushAction(userIdInput)
            set({ pushResult: result })
        } catch {
            set({ pushResult: { success: false, error: "Failed to send push notification" } })
        } finally {
            set({ pushLoading: false })
        }
    },
    handleTestAdminPush: async () => {
        set({ adminPushLoading: true, adminPushResult: null })
        try {
            const result = await testPushToAdminsAction()
            set({ adminPushResult: result })
        } catch {
            set({ adminPushResult: { success: false, error: "Failed to send admin push" } })
        } finally {
            set({ adminPushLoading: false })
        }
    },
    handleSimulateFlow: async () => {
        const userEmailInput = get().userEmailInput
        if (!userEmailInput) return
        set({ flowLoading: true, flowResult: null })
        try {
            const result = await simulateRequestFlowAction(userEmailInput)
            set({ flowResult: result })
        } catch {
            set({ flowResult: { success: false, error: "Failed to simulate flow" } })
        } finally {
            set({ flowLoading: false })
        }
    },
    handleListSubscriptions: async () => {
        set({ subscriptionsLoading: true, subscriptionsResult: null })
        try {
            const result = await listSubscriptionsAction()
            set({ subscriptionsResult: result })
        } catch {
            set({ subscriptionsResult: { success: false, error: "Failed to list subscriptions" } })
        } finally {
            set({ subscriptionsLoading: false })
        }
    },
}))
