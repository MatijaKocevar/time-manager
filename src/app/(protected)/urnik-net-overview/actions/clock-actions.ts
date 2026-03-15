"use server"

import { getUrnikCookie } from "@/lib/urnik-session"
import { requireAuth } from "@/lib/auth-helpers"
import { getErrorMessage } from "../utils/helpers"
import { revalidatePath } from "next/cache"
import { stopTimer } from "@/app/(protected)/shared/actions/timer-actions"
import { prisma } from "@/lib/prisma"
import { DayInfoSchema, type DayInfo, type DayInfoResult } from "../schemas/day-info-schema"
import { URNIK_USER_AGENT } from "../lib/constants"

function parseDayInfo(html: string): DayInfoResult {
    try {
        const expectedFields = [
            "Arrival at work:",
            "Departure from work:",
            "Lunch break:",
            "Total hours:",
            "Overtime work:",
            "Balance today:",
            "Planned:",
            "Shift ends at:",
        ]

        let structureValid = true
        for (const field of expectedFields) {
            if (!html.includes(field)) {
                structureValid = false
                console.warn(`Expected field "${field}" not found in HTML`)
            }
        }

        const extractValue = (pattern: RegExp): string | null => {
            const match = html.match(pattern)
            if (!match || match[1].trim() === "Ni podatka") {
                return null
            }
            return match[1].trim()
        }

        const arrival = extractValue(
            /<span[^>]*>Arrival at work:\s*<\/span><span[^>]*>([^<]+)<\/span>/i
        )
        const departure = extractValue(
            /<span[^>]*>Departure from work:\s*<\/span><span[^>]*>([^<]+)<\/span>/i
        )
        const lunchBreak = extractValue(
            /<span[^>]*>Lunch break:\s*<\/span><span[^>]*>([^<]+)<\/span>/i
        )
        const totalHours = extractValue(
            /<span[^>]*>Total hours:\s*<\/span><span[^>]*>([^<]+)<\/span>/i
        )
        const overtimeWork = extractValue(
            /<span[^>]*>Overtime work:\s*<\/span><span[^>]*>([^<]+)<\/span>/i
        )
        const balanceToday = extractValue(
            /<span[^>]*>Balance today:\s*<\/span><span[^>]*>([^<]+)<\/span>/i
        )
        const planned = extractValue(/<span[^>]*>Planned:\s*<\/span><span[^>]*>([^<]+)<\/span>/i)
        const shiftEndsAt = extractValue(
            /<span[^>]*>Shift ends at:\s*<\/span><span[^>]*>([^<]+)<\/span>/i
        )
        const totalAnnualBalanceYesterday = extractValue(
            /<span[^>]*>Total annual balance yesterday:\s*<\/span><span[^>]*>([^<]+)<\/span>/i
        )
        const totalBalanceNow = extractValue(
            /<span[^>]*>Total balance now:\s*<\/span><span[^>]*>([^<]+)<\/span>/i
        )
        const lastYearVacation = extractValue(
            /<span[^>]*>Last year vacation:\s*<\/span><span[^>]*>([^<]+)<\/span>/i
        )
        const thisYearLeave = extractValue(
            /<span[^>]*>This year&#x27;s leave:\s*<\/span><span[^>]*>([^<]+)<\/span>/i
        )
        const totalVacationDays = extractValue(
            /<span[^>]*>Total vacations days:\s*<\/span><span[^>]*>([^<]+)<\/span>/i
        )
        const setWorkTime = extractValue(/<span[^>]*>Set work time:\s*<\/span>([^<]+)/i)

        const data: DayInfo = {
            arrival,
            departure,
            lunchBreak,
            totalHours,
            overtimeWork,
            balanceToday,
            planned,
            shiftEndsAt,
            totalAnnualBalanceYesterday,
            totalBalanceNow,
            lastYearVacation,
            thisYearLeave,
            totalVacationDays,
            setWorkTime,
            hasArrival: arrival !== null,
            hasDeparture: departure !== null,
            structureValid,
        }

        const validated = DayInfoSchema.safeParse(data)
        if (!validated.success) {
            return {
                success: false,
                error: `Validation failed: ${validated.error.message}`,
                structureValid,
            }
        }

        return {
            success: true,
            data: validated.data,
            structureValid,
        }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to parse HTML"),
            structureValid: false,
        }
    }
}

export async function getTodayDayInfo(): Promise<DayInfoResult> {
    try {
        await requireAuth()

        const cookie = await getUrnikCookie()

        if (!cookie) {
            return { success: false, error: "No urnik credentials or login failed" }
        }

        const response = await fetch("https://urnik.net/App/Main?handler=LoadMonthDayInfo", {
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
            return { success: false, error: `Request failed: ${response.status}` }
        }

        const html = await response.text()
        return parseDayInfo(html)
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error),
            structureValid: false,
        }
    }
}

export async function clockInToUrnik(isWorkFromHome: boolean = false) {
    try {
        await requireAuth()

        const cookie = await getUrnikCookie()

        if (!cookie) {
            return { success: false, error: "No urnik credentials or login failed" }
        }

        const clockInType = isWorkFromHome ? "14" : "0"
        const response = await fetch(
            `https://urnik.net/App/Main?handler=SetTimeInNow&rid=null&ClockInType=${clockInType}`,
            {
                method: "GET",
                headers: {
                    "User-Agent": URNIK_USER_AGENT,
                    Cookie: cookie,
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json, text/javascript, */*; q=0.01",
                    "Accept-Language": "en-GB,en;q=0.9,sl;q=0.8",
                    Origin: "https://urnik.net",
                    Referer: "https://urnik.net/App/Main",
                },
            }
        )

        if (!response.ok) {
            return { success: false, error: `Request failed: ${response.status}` }
        }

        const responseText = await response.text()

        let responseData
        try {
            responseData = JSON.parse(responseText)
        } catch {
            return { success: true, message: "Clocked in successfully" }
        }

        if (responseData.res === false && responseData.msg) {
            return { success: false, error: responseData.msg }
        }

        revalidatePath("/urnik-net-overview")
        return { success: true, message: "Clocked in successfully" }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Unknown error occurred"),
        }
    }
}

export async function clockOutFromUrnik() {
    try {
        await requireAuth()

        const cookie = await getUrnikCookie()

        if (!cookie) {
            return { success: false, error: "No urnik credentials or login failed" }
        }

        const response = await fetch("https://urnik.net/App/Main?handler=SetTimeOutPicker&type=0", {
            method: "GET",
            headers: {
                "User-Agent": URNIK_USER_AGENT,
                Cookie: cookie,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json, text/javascript, */*; q=0.01",
                "Accept-Language": "en-GB,en;q=0.9,sl;q=0.8",
                Origin: "https://urnik.net",
                Referer: "https://urnik.net/App/Main",
            },
        })

        if (!response.ok) {
            return { success: false, error: `Request failed: ${response.status}` }
        }

        const responseText = await response.text()

        let responseData
        try {
            responseData = JSON.parse(responseText)
        } catch {
            return { success: true, message: "Clocked out successfully" }
        }

        if (responseData.res === false && responseData.msg) {
            return { success: false, error: responseData.msg }
        }

        revalidatePath("/urnik-net-overview")
        return { success: true, message: "Clocked out successfully" }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Unknown error occurred"),
        }
    }
}

export async function clockOutAndStopTimer() {
    try {
        const session = await requireAuth()

        const activeTimer = await prisma.taskTimeEntry.findFirst({
            where: {
                userId: session.user.id,
                endTime: null,
            },
        })

        if (activeTimer) {
            const stopResult = await stopTimer({ id: activeTimer.id })
            if (stopResult.error) {
                return { success: false, error: `Failed to stop timer: ${stopResult.error}` }
            }
        }

        const clockOutResult = await clockOutFromUrnik()

        return clockOutResult
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Unknown error occurred"),
        }
    }
}
