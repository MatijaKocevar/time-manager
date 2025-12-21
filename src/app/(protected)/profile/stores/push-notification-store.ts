import { create } from "zustand"
import {
    subscribeUser,
    unsubscribeUser,
} from "@/app/(protected)/profile/actions/notification-actions"

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

interface PushNotificationStoreState {
    isLoading: boolean
    error: string | null
}

interface PushNotificationStoreActions {
    setIsLoading: (isLoading: boolean) => void
    setError: (error: string | null) => void
    subscribeToPush: (vapidPublicKey: string) => Promise<void>
    unsubscribeFromPush: () => Promise<void>
}

export const usePushNotificationStore = create<
    PushNotificationStoreState & PushNotificationStoreActions
>((set) => ({
    isLoading: false,
    error: null,

    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    subscribeToPush: async (vapidPublicKey: string) => {
        set({ isLoading: true, error: null })

        try {
            console.log("Requesting notification permission...")
            const permission = await Notification.requestPermission()
            console.log("Permission result:", permission)
            
            if (permission !== "granted") {
                set({ error: "Notification permission denied", isLoading: false })
                return
            }

            console.log("Getting service worker registration...")
            const registration = await navigator.serviceWorker.ready
            console.log("Service worker ready, subscribing...")
            
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            })
            console.log("Push subscription created:", sub)

            const serializedSub = JSON.parse(JSON.stringify(sub))
            console.log("Calling subscribeUser with:", serializedSub)
            
            const result = await subscribeUser(serializedSub)
            console.log("subscribeUser result:", result)

            if (result.error) {
                set({ error: result.error, isLoading: false })
                await sub.unsubscribe()
                throw new Error(result.error)
            } else {
                set({ isLoading: false })
            }
        } catch (err) {
            console.error("Error subscribing to push notifications:", err)
            set({ error: "Failed to subscribe to notifications", isLoading: false })
            throw err
        }
    },

    unsubscribeFromPush: async () => {
        set({ isLoading: true, error: null })

        try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.getSubscription()
            await sub?.unsubscribe()
            await unsubscribeUser()
            set({ isLoading: false })
        } catch (err) {
            console.error("Error unsubscribing:", err)
            set({ error: "Failed to unsubscribe", isLoading: false })
            throw err
        }
    },
}))
