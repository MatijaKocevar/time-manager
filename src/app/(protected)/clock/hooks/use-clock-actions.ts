import { useRouter } from "next/navigation"
import { useClockStore } from "../stores/clock-store"

export function useClockIn() {
    const router = useRouter()
    const clockIn = useClockStore((state) => state.clockIn)
    const isClockingIn = useClockStore((state) => state.isClockingIn)

    const handleClockIn = async (translations: {
        clockInSuccess: string
        errorTitle: string
        isWorkFromHome: boolean
    }) => {
        const result = await clockIn(translations)
        if (result.shouldRefresh) {
            router.refresh()
        }
        return result
    }

    return { clockIn: handleClockIn, isClockingIn }
}

export function useClockOut() {
    const router = useRouter()
    const clockOut = useClockStore((state) => state.clockOut)
    const isClockingOut = useClockStore((state) => state.isClockingOut)

    const handleClockOut = async (translations: {
        clockOutSuccess: string
        errorTitle: string
    }) => {
        const result = await clockOut(translations)
        if (result.shouldRefresh) {
            router.refresh()
        }
        return result
    }

    return { clockOut: handleClockOut, isClockingOut }
}
