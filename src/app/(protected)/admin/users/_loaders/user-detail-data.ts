import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { getUserById } from "../_actions/user-actions"
import {
    getHourEntriesForUser,
    getAttendanceDataForUser,
} from "@/app/(protected)/hours/_actions/hour-actions"
import { getHolidaysInRange } from "../../holidays/_actions/holiday-actions"
import { getUserRequestsForAdmin } from "@/app/(protected)/requests/_actions/request-actions"

function getCurrentMonthDates() {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    return {
        startDate: formatDate(firstDay),
        endDate: formatDate(lastDay),
    }
}

export async function loadUserDetailData(id: string) {
    const { startDate, endDate } = getCurrentMonthDates()

    const [user, userHours, userRequests, holidays, attendanceData, session] = await Promise.all([
        getUserById(id),
        getHourEntriesForUser(id, startDate, endDate),
        getUserRequestsForAdmin(id),
        getHolidaysInRange(startDate, endDate),
        getAttendanceDataForUser(id, startDate, endDate),
        getServerSession(authConfig),
    ])

    return {
        user,
        userHours,
        userRequests,
        holidays,
        attendanceData,
        currentUserIsDemo: session?.user?.isDemo ?? false,
    }
}
