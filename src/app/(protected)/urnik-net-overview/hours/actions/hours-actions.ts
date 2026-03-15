"use server"

import { getUrnikCookie } from "@/lib/urnik-session"
import { requireAuth } from "@/lib/auth-helpers"
import { URNIK_USER_AGENT } from "../../lib/constants"
import { getErrorMessage } from "../../utils/helpers"
import { prisma } from "@/lib/prisma"
import type { ParsedHoursResult } from "../schemas/hours-schema"
import { parseHoursHtml } from "../utils/parse-hours"

export async function fetchMonthlyHours(year: number, month: number): Promise<ParsedHoursResult> {
    try {
        const session = await requireAuth()

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                urnikUsername: true,
                urnikPassword: true,
                urnikUserId: true,
                isDemo: true,
            },
        })

        if (!user?.urnikUsername || !user?.urnikPassword) {
            return {
                success: false,
                error: "No urnik.net credentials found. Please configure them in your profile.",
            }
        }

        if (user.isDemo) {
            return {
                success: true,
                data: {
                    summary: {
                        billingHours: "40h 00min",
                        plannedHours: "176h",
                        workDays: "22 Days",
                        holidays: "0 Days",
                        lunches: "0",
                        vacationBalance: "16 Days",
                        sickLeave: "0h 0min",
                        leaveDays: "0 Days",
                        balance: "0h 0min",
                        workFromHome: "0 Days",
                        userType: "Demo",
                        hoursInDay: "8h",
                    },
                    days: [],
                },
            }
        }

        const cookie = await getUrnikCookie()

        if (!cookie) {
            return {
                success: false,
                error: "Failed to authenticate with urnik.net. Please check your credentials.",
            }
        }

        const updatedUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { urnikUserId: true },
        })

        if (!updatedUser?.urnikUserId) {
            return {
                success: false,
                error: "User ID extraction failed. Please check your urnik.net credentials and try again.",
            }
        }

        const url = `https://urnik.net/App/Tabels/SimpleTable?handler=LoadMainTable&UserID=${updatedUser.urnikUserId}&year=${year}&month=${month - 1}`

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
            return {
                success: false,
                error: `Failed to fetch hours data: ${response.status} ${response.statusText}`,
            }
        }

        const html = await response.text()

        const parseResult = parseHoursHtml(html)

        if (!parseResult.success) {
            return parseResult
        }

        return {
            success: true,
            data: parseResult.data,
            validationWarnings: parseResult.validationWarnings,
        }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to fetch hours data"),
        }
    }
}
