import "dotenv/config"

const CHECK_INTERVAL_MS = 60 * 1000
const BASE_URL = "http://localhost:3000"

async function processTriggers(): Promise<void> {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
        console.error("CRON_SECRET env var not set, aborting")
        return
    }

    try {
        const response = await fetch(`${BASE_URL}/api/internal/process-auto-clock`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${cronSecret}`,
            },
        })

        const data = await response.json()

        if (response.ok) {
            console.log(
                `[${new Date().toISOString()}] Processed ${data.processed} user(s)`,
                data.errors ? `Errors: ${JSON.stringify(data.errors)}` : ""
            )
        } else {
            console.error(`[${new Date().toISOString()}] API error ${response.status}:`, data)
        }
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error calling process-auto-clock:`, err)
    }
}

async function run(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Auto check-in/check-out cron started`)

    while (true) {
        await processTriggers()
        await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL_MS))
    }
}

run().catch((err) => {
    console.error("Fatal error in auto check-in/check-out cron:", err)
    process.exit(1)
})
