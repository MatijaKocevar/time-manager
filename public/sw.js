self.addEventListener("push", function (event) {
    if (event.data) {
        const data = event.data.json()
        const options = {
            body: data.body,
            icon: data.icon || "/logo.svg",
            badge: "/pwa/icon-192x192.png",
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: "1",
                url: data.url || "/",
                ...data.data,
            },
            actions: data.actions || [],
            tag: data.tag || "default",
        }
        event.waitUntil(self.registration.showNotification(data.title, options))
    }
})

let activeDelayRequest = false

self.addEventListener("notificationclick", function (event) {
    event.notification.close()

    const action = event.action
    const notificationData = event.notification.data

    if (action && action.startsWith("delay-")) {
        if (activeDelayRequest) {
            return
        }
        activeDelayRequest = true

        const minutes = parseInt(action.replace("delay-", ""), 10)
        const adjustmentType = notificationData.adjustmentType

        event.waitUntil(
            fetch("/api/adjust-work-time-quick", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    delayMinutes: minutes,
                    type: adjustmentType,
                }),
                credentials: "include",
            })
                .then((response) => {
                    if (!response.ok) {
                        return self.registration.showNotification("Delay Failed", {
                            body: "Could not delay work time. Please open the app and try again.",
                            icon: "/logo.svg",
                            badge: "/pwa/icon-192x192.png",
                        })
                    }
                    return self.registration.showNotification("Time Adjusted", {
                        body: `Work time delayed by ${minutes} minutes`,
                        icon: "/logo.svg",
                        badge: "/pwa/icon-192x192.png",
                    })
                })
                .catch((error) => {
                    console.error("Failed to adjust time:", error)
                    return self.registration.showNotification("Delay Failed", {
                        body: "Could not delay work time. Please open the app and try again.",
                        icon: "/logo.svg",
                        badge: "/pwa/icon-192x192.png",
                    })
                })
                .finally(() => {
                    activeDelayRequest = false
                })
        )
        return
    }

    if (action === "cancel-auto") {
        const cancelType = notificationData.cancelType

        event.waitUntil(
            fetch(
                cancelType === "checkout"
                    ? "/api/internal/cancel-auto-checkout"
                    : "/api/adjust-work-time",
                {
                    method: cancelType === "checkout" ? "POST" : "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                }
            )
                .then((response) => {
                    if (!response.ok) {
                        return self.registration.showNotification("Cancellation Failed", {
                            body: "Could not cancel auto clock. Please open the app and try again.",
                            icon: "/logo.svg",
                            badge: "/pwa/icon-192x192.png",
                        })
                    }
                    return self.registration.showNotification("Cancelled", {
                        body:
                            cancelType === "checkout"
                                ? "Auto check-out cancelled for today"
                                : "Auto check-in cancelled for today",
                        icon: "/logo.svg",
                        badge: "/pwa/icon-192x192.png",
                    })
                })
                .catch((error) => {
                    console.error("Failed to cancel:", error)
                    return self.registration.showNotification("Cancellation Failed", {
                        body: "Could not cancel auto clock. Please open the app and try again.",
                        icon: "/logo.svg",
                        badge: "/pwa/icon-192x192.png",
                    })
                })
        )
        return
    }

    const urlToOpen = notificationData.url || "/"

    event.waitUntil(
        clients.matchAll({ type: "window", includeUnowned: true }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i]
                if (client.url === urlToOpen && "focus" in client) {
                    return client.focus()
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen)
            }
        })
    )
})
