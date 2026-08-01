"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { URNIK_USER_AGENT } from "../../_lib/constants"
import { getErrorMessage } from "../../_utils/helpers"
import { loginToUrnikNet } from "./urnik-net-auth"

interface UrnikNetRequest {
    no: string
    requestDate: string
    requestType: string
    period: string
    days: string
    hours: string
    pPrihod: string
    arrival: string
    arrivalRequests: string
    pOdhod: string
    departure: string
    departureRequests: string
    oldSchedule: string
    newSchedule: string
    status: string
    confirmedBy: string
    notes: string
    hasActions: boolean
}

function parseUrnikNetRequestsHtml(html: string): {
    success: boolean
    data?: UrnikNetRequest[]
    error?: string
    structureValid: boolean
} {
    try {
        const tableMatch = html.match(/<table[^>]*class="table"[^>]*>([\s\S]*?)<\/table>/)
        if (!tableMatch) {
            return {
                success: false,
                error: "Table with class 'table' not found - HTML structure may have changed",
                structureValid: false,
            }
        }

        const theadMatch = html.match(/<thead>([\s\S]*?)<\/thead>/)
        if (!theadMatch) {
            return {
                success: false,
                error: "Table header not found - HTML structure may have changed",
                structureValid: false,
            }
        }

        const expectedHeaders = [
            "No.",
            "Request date",
            "Request type",
            "Period",
            "Days",
            "Hours",
            "P. Prihod",
            "Arrival",
            "Requests",
            "P. Odhod",
            "Departure",
            "Requests",
            "Old schedule",
            "New schedule",
            "Status",
            "Confirmed by",
            "Notes",
        ]

        const headerCells = [...theadMatch[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)]
        const headerTexts = headerCells.map((m) => m[1].trim())

        let validHeaders = true
        for (let i = 0; i < expectedHeaders.length; i++) {
            if (headerTexts[i] !== expectedHeaders[i]) {
                validHeaders = false
                break
            }
        }

        if (!validHeaders || headerCells.length < 17) {
            return {
                success: false,
                error: `Table headers changed - expected ${expectedHeaders.length}+ columns, found ${headerCells.length}. Structure validation failed.`,
                structureValid: false,
            }
        }

        const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/)
        if (!tbodyMatch) {
            return {
                success: false,
                error: "Table body not found - HTML structure may have changed",
                structureValid: false,
            }
        }

        const rowMatches = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
        const urnikNetRequests: UrnikNetRequest[] = []

        for (const rowMatch of rowMatches) {
            const row = rowMatch[1]
            const cellMatches = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]

            if (cellMatches.length < 17) {
                console.warn(`Row has unexpected cell count: ${cellMatches.length}, skipping`)
                continue
            }

            const getCellText = (index: number) => {
                const cell = cellMatches[index]?.[1] || ""
                return cell
                    .replace(/<span[^>]*style="color:\s*\w+"[^>]*>/gi, "")
                    .replace(/<span[^>]*>/gi, "")
                    .replace(/<\/span>/gi, "")
                    .replace(/<button[\s\S]*?<\/button>/gi, "")
                    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
                        String.fromCharCode(parseInt(hex, 16))
                    )
                    .replace(/&nbsp;/g, " ")
                    .trim()
            }

            const hasActions = cellMatches[17]?.[1].includes("<button") || false

            urnikNetRequests.push({
                no: getCellText(0),
                requestDate: getCellText(1),
                requestType: getCellText(2),
                period: getCellText(3),
                days: getCellText(4),
                hours: getCellText(5),
                pPrihod: getCellText(6),
                arrival: getCellText(7),
                arrivalRequests: getCellText(8),
                pOdhod: getCellText(9),
                departure: getCellText(10),
                departureRequests: getCellText(11),
                oldSchedule: getCellText(12),
                newSchedule: getCellText(13),
                status: getCellText(14),
                confirmedBy: getCellText(15),
                notes: getCellText(16),
                hasActions,
            })
        }

        return {
            success: true,
            data: urnikNetRequests,
            structureValid: true,
        }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to parse HTML"),
            structureValid: false,
        }
    }
}

export async function fetchUrnikNetRequests(month?: string) {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
        return { success: false, error: "Unauthorized" }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            urnikUsername: true,
            urnikPassword: true,
        },
    })

    if (!user?.urnikUsername || !user?.urnikPassword) {
        return { success: false, error: "No credentials saved" }
    }

    const loginResult = await loginToUrnikNet(user.urnikUsername, user.urnikPassword)

    if (!loginResult.success || !loginResult.cookie) {
        return { success: false, error: loginResult.error || "Login failed" }
    }

    try {
        const response = await fetch(
            "https://urnik.net/App/MyRequests/MyRequests?handler=LoadRequests",
            {
                method: "GET",
                headers: {
                    "User-Agent": URNIK_USER_AGENT,
                    Cookie: loginResult.cookie,
                },
            }
        )

        if (!response.ok) {
            return { success: false, error: `Failed to fetch requests: ${response.status}` }
        }

        const html = await response.text()
        const parsed = parseUrnikNetRequestsHtml(html)

        if (!parsed.structureValid) {
            return {
                success: false,
                error: parsed.error || "HTML structure validation failed",
                structureChanged: true,
            }
        }

        if (!parsed.success) {
            return { success: false, error: parsed.error || "Failed to parse HTML" }
        }

        let filteredData = parsed.data || []

        if (month) {
            const [year, monthNum] = month.split("-")
            filteredData = filteredData.filter((req) => {
                const match = req.period.match(/(\d{2})\.(\d{2})\.(\d{4})/)
                if (match) {
                    const [, , reqMonth, reqYear] = match
                    return reqYear === year && reqMonth === monthNum.padStart(2, "0")
                }
                return false
            })
        }

        return { success: true, data: filteredData }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Unknown error occurred"),
        }
    }
}
