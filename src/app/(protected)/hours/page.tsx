import { getHourEntries } from "./actions/hour-actions"
import { HoursView } from "./components/hours-view"

function getWeekDates() {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    return {
        startDate: formatDate(monday),
        endDate: formatDate(sunday),
    }
}

export default async function HoursPage() {
    const { startDate, endDate } = getWeekDates()
    const entries = await getHourEntries(startDate, endDate)

    return (
        <div className="space-y-4">
            <HoursView initialEntries={entries} initialMode="WEEKLY" />
        </div>
    )
}
