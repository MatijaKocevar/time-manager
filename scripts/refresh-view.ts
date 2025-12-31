import { refreshDailyHourSummary } from "@/lib/materialized-views"

async function refreshView() {
    console.log("Refreshing daily_hour_summary materialized view...")
    await refreshDailyHourSummary()
    console.log("Materialized view refreshed successfully!")
}

refreshView().catch((error: Error) => {
    console.error("Error:", error)
    process.exit(1)
})
