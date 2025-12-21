"use client"

import { useState, useEffect } from "react"
import {
    subscribeUser,
    unsubscribeUser,
} from "@/app/(protected)/profile/actions/notification-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff } from "lucide-react"

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

export function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if ("serviceWorker" in navigator && "PushManager" in window) {
            setIsSupported(true)
            registerServiceWorker()
        }
    }, [])

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register("/sw.js", {
                scope: "/",
                updateViaCache: "none",
            })
            const sub = await registration.pushManager.getSubscription()
            setSubscription(sub)
        } catch (err) {
            console.error("Service worker registration failed:", err)
            setError("Failed to register service worker")
        }
    }

    async function subscribeToPush() {
        setIsLoading(true)
        setError(null)

        try {
            const permission = await Notification.requestPermission()
            if (permission !== "granted") {
                setError("Notification permission denied")
                setIsLoading(false)
                return
            }

            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
                ),
            })

            setSubscription(sub)

            const serializedSub = JSON.parse(JSON.stringify(sub))
            const result = await subscribeUser(serializedSub)

            if (result.error) {
                setError(result.error)
                await sub.unsubscribe()
                setSubscription(null)
            }
        } catch (err) {
            console.error("Error subscribing to push notifications:", err)
            setError("Failed to subscribe to notifications")
        } finally {
            setIsLoading(false)
        }
    }

    async function unsubscribeFromPush() {
        setIsLoading(true)
        setError(null)

        try {
            await subscription?.unsubscribe()
            setSubscription(null)
            await unsubscribeUser()
        } catch (err) {
            console.error("Error unsubscribing:", err)
            setError("Failed to unsubscribe")
        } finally {
            setIsLoading(false)
        }
    }

    if (!isSupported) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Push Notifications</CardTitle>
                    <CardDescription>
                        Push notifications are not supported in this browser.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {subscription ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                    Push Notifications
                </CardTitle>
                <CardDescription>
                    {subscription
                        ? "You are subscribed to push notifications. You will receive alerts for request updates."
                        : "Enable push notifications to receive instant alerts about request approvals and new pending requests."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {subscription ? (
                    <div className="space-y-4">
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            ✓ Notifications are enabled. You will receive push alerts.
                        </div>
                        <Button
                            onClick={unsubscribeFromPush}
                            disabled={isLoading}
                            variant="outline"
                            className="w-full"
                        >
                            <BellOff className="mr-2 h-4 w-4" />
                            {isLoading ? "Unsubscribing..." : "Disable Notifications"}
                        </Button>
                    </div>
                ) : (
                    <Button onClick={subscribeToPush} disabled={isLoading} className="w-full">
                        <Bell className="mr-2 h-4 w-4" />
                        {isLoading ? "Enabling..." : "Enable Notifications"}
                    </Button>
                )}

                <p className="text-xs text-muted-foreground">
                    Note: Push notifications require HTTPS. To test locally, use{" "}
                    <code>next dev --experimental-https</code>
                </p>
            </CardContent>
        </Card>
    )
}
