"use server"

import { URNIK_USER_AGENT } from "@/app/(protected)/urnik-net-overview/_utils/constants"
import { getUrnikCookie } from "@/app/(protected)/urnik-net-overview/_utils/urnik-session"
import { requireAuth } from "@/lib/auth-helpers"
import { validateInput } from "@/lib/validation"
import {
    GetUrnikAbsencesSchema,
    type GetUrnikAbsencesInput,
    type UrnikAbsence,
    type UrnikEmployee,
} from "../_schemas/urnik-absence-schemas"
import { parseUrnikAbsencesHtml } from "../_utils/urnik-absences-parser"

interface UrnikAbsencesResult {
    absences: UrnikAbsence[]
    employees: UrnikEmployee[]
}

function formatDateString(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

function getMonthsInRange(startDate: Date, endDate: Date) {
    const months: Array<{ year: number; month: number }> = []
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1)

    while (cursor <= endDate) {
        months.push({ year: cursor.getFullYear(), month: cursor.getMonth() })
        cursor.setMonth(cursor.getMonth() + 1)
    }

    return months
}

async function fetchMonthAbsences(cookie: string, year: number, month: number) {
    const url = `https://urnik.net/App/Absences/Absences?handler=LoadTable&month=${month}&year=${year}&searchParameter=`

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "User-Agent": URNIK_USER_AGENT,
            Cookie: cookie,
            "X-Requested-With": "XMLHttpRequest",
            Accept: "*/*",
            "Accept-Language": "en-GB,en;q=0.9,sl;q=0.8",
            Referer: "https://urnik.net/App/Main",
        },
    })

    if (!response.ok) {
        console.error(`Failed to fetch urnik absences: ${response.status} ${response.statusText}`)
        return null
    }

    const parsed = parseUrnikAbsencesHtml(await response.text())

    if (!parsed.success || !parsed.data) {
        console.error(parsed.error || "Failed to parse urnik absences")
        return null
    }

    return parsed.data
}

export async function fetchUrnikAbsences(
    input: GetUrnikAbsencesInput
): Promise<UrnikAbsencesResult> {
    await requireAuth()

    const validation = validateInput(GetUrnikAbsencesSchema, input)

    if (!validation.success) {
        return { absences: [], employees: [] }
    }

    try {
        return await collectUrnikAbsences(validation.data.startDate, validation.data.endDate)
    } catch (error) {
        console.error("Failed to fetch urnik absences:", error)
        return { absences: [], employees: [] }
    }
}

async function collectUrnikAbsences(startDate: Date, endDate: Date): Promise<UrnikAbsencesResult> {
    const cookie = await getUrnikCookie()

    if (!cookie) {
        return { absences: [], employees: [] }
    }

    const startString = formatDateString(startDate)
    const endString = formatDateString(endDate)
    const employees = new Map<string, UrnikEmployee>()
    const seen = new Set<string>()
    const absences: UrnikAbsence[] = []

    for (const { year, month } of getMonthsInRange(startDate, endDate)) {
        try {
            const monthEmployees = await fetchMonthAbsences(cookie, year, month)

            if (!monthEmployees) {
                continue
            }

            for (const employee of monthEmployees) {
                const employeeId = `urnik:${employee.urnikUserId ?? employee.name}`

                if (!employees.has(employeeId)) {
                    employees.set(employeeId, { id: employeeId, name: employee.name })
                }

                for (const day of employee.days) {
                    const dateString = formatDateString(new Date(year, month, day.day))

                    if (dateString < startString || dateString > endString) {
                        continue
                    }

                    const key = `${employeeId}-${dateString}`

                    if (seen.has(key)) {
                        continue
                    }

                    seen.add(key)
                    absences.push({ userId: employeeId, dateString, badge: day.badge })
                }
            }
        } catch (error) {
            console.error("Failed to fetch urnik absences month:", error)
        }
    }

    return { absences, employees: [...employees.values()] }
}
