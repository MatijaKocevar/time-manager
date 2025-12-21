"use client"

import { useState, useEffect } from "react"
import { usePushNotificationStore } from "@/app/(protected)/profile/stores/push-notification-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff } from "lucide-react"

interface PushNotificationManagerProps {
    initialHasSubscription: boolean
    vapidPublicKey: string
}

export function PushNotificationManager({
    initialHasSubscription,
    vapidPublicKey,
}: PushNotificationManagerProps) {
    const [hasSubscription, setHasSubscription] = useState(false)
    const [isCheckingBrowser, setIsCheckingBrowser] = useState(true)

    const isLoading = usePushNotificationStore((state) => state.isLoading)
    const error = usePushNotificationStore((state) => state.error)
    const subscribeToPush = usePushNotificationStore((state) => state.subscribeToPush)
    const unsubscribeFromPush = usePushNotificationStore((state) => state.unsubscribeFromPush)

    useEffect(() => {
        async function checkBrowserSubscription() {
            if ("serviceWorker" in navigator && "PushManager" in window) {
                try {
                    const registration = await navigator.serviceWorker.register("/sw.js", {
                        scope: "/",
                        updateViaCache: "none",
                    })

                    const browserSubscription = await registration.pushManager.getSubscription()
                    setHasSubscription(browserSubscription !== null)
                } catch (error) {
                    console.error("Error checking browser subscription:", error)
                    setHasSubscription(false)
                }
            }
            setIsCheckingBrowser(false)
        }

        checkBrowserSubscription()
    }, [])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {hasSubscription ? (
                        <Bell className="h-5 w-5" />
                    ) : (
                        <BellOff className="h-5 w-5" />
                    )}
                    Push Notifications
                </CardTitle>
                <CardDescription>
                    {hasSubscription
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

                {isCheckingBrowser ? (
                    <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                        Checking browser subscription status...
                    </div>
                ) : hasSubscription ? (
                    <div className="space-y-4">
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            ✓ Notifications are enabled. You will receive push alerts.
                        </div>
                        <Button
                            onClick={async () => {
                                try {
                                    await unsubscribeFromPush()
                                    setHasSubscription(false)
                                } catch {
                                    // Error handled by store
                                }
                            }}
                            disabled={isLoading}
                            variant="outline"
                            className="w-full"
                        >
                            <BellOff className="mr-2 h-4 w-4" />
                            {isLoading ? "Unsubscribing..." : "Disable Notifications"}
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={async () => {
                            try {
                                await subscribeToPush(vapidPublicKey)
                                setHasSubscription(true)
                            } catch {
                                // Error handled by store
                            }
                        }}
                        disabled={isLoading}
                        className="w-full"
                    >
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
