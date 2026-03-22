import "dotenv/config"

const MIN_INTERVAL_MS = 30 * 60 * 1000
const MAX_INTERVAL_MS = 45 * 60 * 1000

function randomInterval(): number {
    return Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1)) + MIN_INTERVAL_MS
}

async function syncUrnikStatuses(): Promise<void> {
    const secret = process.env.CRON_SECRET
    if (!secret) {
        console.error("CRON_SECRET env var not set, aborting sync")
        return
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const url = `${baseUrl}/api/internal/sync-urnik-statuses`

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${secret}`,
            },
        })

        const data = await response.json()

        if (response.ok) {
            console.log(
                `[${new Date().toISOString()}] Sync complete: ${data.synced} request(s) updated`
            )
            if (data.errors) {
                console.warn("Sync errors:", data.errors)
            }
        } else {
            console.error(`[${new Date().toISOString()}] Sync failed: ${response.status}`, data)
        }
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Sync error:`, err)
    }
}

async function run(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Urnik sync cron started`)

    while (true) {
        await syncUrnikStatuses()
        const interval = randomInterval()
        const minutes = Math.round(interval / 60000)
        console.log(`[${new Date().toISOString()}] Next sync in ${minutes} minutes`)
        await new Promise((resolve) => setTimeout(resolve, interval))
    }
}

run().catch((err) => {
    console.error("Fatal error in sync cron:", err)
    process.exit(1)
})
