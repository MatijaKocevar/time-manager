import { recalculateDailySummaryStandalone } from "./src/app/(protected)/hours/utils/summary-helpers.js"

const dates = ["2025-12-05", "2025-12-12", "2025-12-19", "2025-12-31"]
const userId = "cm4q5i81m0000r9m6b4nlwyws"

async function fix() {
    for (const d of dates) {
        await recalculateDailySummaryStandalone(userId, new Date(d), "WORK_FROM_HOME")
        console.log("Recalculated", d)
    }
}

fix()
