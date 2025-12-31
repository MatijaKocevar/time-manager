import { prisma } from "../src/lib/prisma"

async function main() {
    console.log("=== ALL Daily Hour Summary Rows ===\n")

    const summaries = await prisma.$queryRaw<
        Array<{
            userId: string
            date: Date
            type: string
            manualHours: number
            trackedHours: number
            totalHours: number
        }>
    >`SELECT * FROM daily_hour_summary ORDER BY date, type`

    if (summaries.length === 0) {
        console.log("❌ NO ROWS IN MATERIALIZED VIEW")
    } else {
        for (const summary of summaries) {
            console.log(
                `Date: ${summary.date.toISOString().split("T")[0]}, Type: ${summary.type}, Manual: ${summary.manualHours}h, Tracked: ${summary.trackedHours}h, Total: ${summary.totalHours}h`
            )
        }
    }

    console.log("\n=== TaskTimeEntry Aggregation (what SHOULD be in view) ===\n")

    const tracked = await prisma.$queryRaw<
        Array<{
            user_id: string
            normalized_date: Date
            type: string
            tracked_hours: number
        }>
    >`
        SELECT
            "userId" AS user_id,
            DATE("startTime" AT TIME ZONE 'UTC') AS normalized_date,
            type,
            COALESCE(SUM(duration), 0) / 3600.0 AS tracked_hours
        FROM "TaskTimeEntry"
        WHERE "endTime" IS NOT NULL 
            AND duration IS NOT NULL
        GROUP BY "userId", DATE("startTime" AT TIME ZONE 'UTC'), type
        ORDER BY normalized_date, type
    `

    for (const row of tracked) {
        console.log(
            `User: ${row.user_id}, Date: ${row.normalized_date.toISOString().split("T")[0]}, Type: ${row.type}, Tracked: ${row.tracked_hours}h`
        )
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
