import { create } from "zustand"
import { clockInToUrnik, clockOutAndStopTimer } from "../actions/clock-actions"
import { toast } from "sonner"

interface ClockStoreState {
    isClockingIn: boolean
    isClockingOut: boolean
}

interface ClockStoreActions {
    clockIn: (translations: {
        clockInSuccess: string
        errorTitle: string
        isWorkFromHome: boolean
    }) => Promise<{ success: boolean; shouldRefresh: boolean }>
    clockOut: (translations: {
        clockOutSuccess: string
        errorTitle: string
    }) => Promise<{ success: boolean; shouldRefresh: boolean }>
    reset: () => void
}

export const useClockStore = create<ClockStoreState & ClockStoreActions>((set) => ({
    isClockingIn: false,
    isClockingOut: false,

    clockIn: async (translations) => {
        set({ isClockingIn: true })
        try {
            const result = await clockInToUrnik(translations.isWorkFromHome)
            if (result.success) {
                toast.success(translations.clockInSuccess)
                return { success: true, shouldRefresh: true }
            } else {
                toast.error(translations.errorTitle, {
                    description: result.error,
                })
                return { success: false, shouldRefresh: false }
            }
        } catch (error) {
            toast.error(translations.errorTitle, {
                description: error instanceof Error ? error.message : "Unknown error",
            })
            return { success: false, shouldRefresh: false }
        } finally {
            set({ isClockingIn: false })
        }
    },

    clockOut: async (translations) => {
        set({ isClockingOut: true })
        try {
            const result = await clockOutAndStopTimer()
            if (result.success) {
                toast.success(translations.clockOutSuccess)
                return { success: true, shouldRefresh: true }
            } else {
                toast.error(translations.errorTitle, {
                    description: result.error,
                })
                return { success: false, shouldRefresh: false }
            }
        } catch (error) {
            toast.error(translations.errorTitle, {
                description: error instanceof Error ? error.message : "Unknown error",
            })
            return { success: false, shouldRefresh: false }
        } finally {
            set({ isClockingOut: false })
        }
    },

    reset: () =>
        set({
            isClockingIn: false,
            isClockingOut: false,
        }),
}))
