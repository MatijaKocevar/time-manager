self.addEventListener("push", function (event) {
    if (event.data) {
        const data = event.data.json()
        const options = {
            body: data.body,
            icon: data.icon || "/icon-192x192.png",
            badge: "/icon-192x192.png",
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: "1",
                url: data.url || "/",
                ...data.data,
            },
            actions: data.actions || [],
        }
        event.waitUntil(self.registration.showNotification(data.title, options))
    }
})

self.addEventListener("notificationclick", function (event) {
    event.notification.close()

    const action = event.action
    const notificationData = event.notification.data

    if (action && action.startsWith("delay-")) {
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
                .then(() => {
                    return self.registration.showNotification("Time Adjusted", {
                        body: `Work time delayed by ${minutes} minutes`,
                        icon: "/icon-192x192.png",
                        badge: "/icon-192x192.png",
                    })
                })
                .catch((error) => {
                    console.error("Failed to adjust time:", error)
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
                .then(() => {
                    return self.registration.showNotification("Cancelled", {
                        body:
                            cancelType === "checkout"
                                ? "Auto check-out cancelled for today"
                                : "Auto check-in cancelled for today",
                        icon: "/icon-192x192.png",
                        badge: "/icon-192x192.png",
                    })
                })
                .catch((error) => {
                    console.error("Failed to cancel:", error)
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
