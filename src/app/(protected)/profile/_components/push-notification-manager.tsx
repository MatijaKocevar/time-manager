"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { usePushNotificationStore } from "@/app/(protected)/profile/_stores/push-notification-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff } from "lucide-react"
import { toast } from "sonner"

interface PushNotificationManagerProps {
    initialHasSubscription: boolean
    vapidPublicKey: string
}

export function PushNotificationManager({ vapidPublicKey }: PushNotificationManagerProps) {
    const t = useTranslations("notifications.pushNotifications")

    const [hasSubscription, setHasSubscription] = useState(false)
    const [isCheckingBrowser, setIsCheckingBrowser] = useState(true)

    const isLoading = usePushNotificationStore((state) => state.isLoading)
    const error = usePushNotificationStore((state) => state.error)
    const setError = usePushNotificationStore((state) => state.setError)
    const subscribeToPush = usePushNotificationStore((state) => state.subscribeToPush)
    const unsubscribeFromPush = usePushNotificationStore((state) => state.unsubscribeFromPush)

    useEffect(() => {
        if (error) {
            toast.error(error)
            setError(null)
        }
    }, [error, setError])

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
                    {t("title")}
                </CardTitle>
                <CardDescription>
                    {hasSubscription ? t("descriptionSubscribed") : t("description")}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isCheckingBrowser ? (
                    <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                        Checking browser subscription status...
                    </div>
                ) : hasSubscription ? (
                    <div className="space-y-4">
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            {t("subscribed")}
                        </div>
                        <div className="flex justify-end">
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
                            >
                                <BellOff className="mr-2 h-4 w-4" />
                                {isLoading ? t("unsubscribing") : t("disable")}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-end">
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
                        >
                            <Bell className="mr-2 h-4 w-4" />
                            {isLoading ? t("enabling") : t("enable")}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
