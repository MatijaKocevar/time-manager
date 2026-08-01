"use server"

import { requireAuth } from "@/lib/auth-helpers"
import { getUrnikCookie } from "@/lib/urnik-session"
import { URNIK_USER_AGENT } from "../../_lib/constants"
import { prisma } from "@/lib/prisma"
import { parseAttendanceHtml } from "../_utils/parse-attendance"
import type { ParsedAttendanceResult } from "../_schemas/attendance-schema"

export async function fetchTeamStatus(): Promise<ParsedAttendanceResult> {
    try {
        const session = await requireAuth()

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                urnikUsername: true,
                urnikPassword: true,
                isDemo: true,
            },
        })

        if (!user?.urnikUsername || !user?.urnikPassword) {
            return {
                success: false,
                error: "No urnik.net credentials found. Please configure them in your profile.",
                structureValid: false,
            }
        }

        if (user.isDemo) {
            return {
                success: true,
                data: {
                    present: [
                        {
                            name: "Demo User",
                            status: "Present",
                            colorClass: "BC-0",
                            imageUrl: null,
                        },
                    ],
                    absent: [
                        {
                            name: "Demo Colleague",
                            status: "Absent",
                            colorClass: "BC-99",
                            imageUrl: null,
                        },
                    ],
                },
                structureValid: true,
            }
        }

        const cookie = await getUrnikCookie()

        if (!cookie) {
            return {
                success: false,
                error: "Failed to authenticate with urnik.net. Please check your credentials.",
                structureValid: false,
            }
        }

        const response = await fetch("https://urnik.net/App/Main?handler=LoadUsers", {
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
                error: `Failed to fetch team status: ${response.status} ${response.statusText}`,
                structureValid: false,
            }
        }

        const html = await response.text()

        return parseAttendanceHtml(html)
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error fetching team status",
            structureValid: false,
        }
    }
}
