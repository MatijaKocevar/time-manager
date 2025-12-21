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
            },
        }
        event.waitUntil(self.registration.showNotification(data.title, options))
    }
})

self.addEventListener("notificationclick", function (event) {
    console.log("Notification click received.")
    event.notification.close()

    const urlToOpen = event.notification.data.url || "/"

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
