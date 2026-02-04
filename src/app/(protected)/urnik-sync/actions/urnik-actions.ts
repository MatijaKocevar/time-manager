"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { HourType } from "@/../../prisma/generated/client"
import {
    GetPendingRequestsInputSchema,
    type GetPendingRequestsInput,
    type PendingUrnikRequest,
} from "../schemas/pending-request-schemas"

interface UrnikRequest {
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

function parseUrnikRequestsHtml(html: string): {
    success: boolean
    data?: UrnikRequest[]
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
        const requests: UrnikRequest[] = []

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

            requests.push({
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
            data: requests,
            structureValid: true,
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to parse HTML",
            structureValid: false,
        }
    }
}

async function loginToUrnik(username: string, password: string) {
    try {
        const loginPageResponse = await fetch("https://urnik.net/Account/Login", {
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
            },
        })

        if (!loginPageResponse.ok) {
            return {
                success: false,
                error: `Failed to load login page: ${loginPageResponse.status}`,
            }
        }

        const htmlContent = await loginPageResponse.text()
        const setCookieHeader = loginPageResponse.headers.get("set-cookie")
        if (!setCookieHeader) {
            return { success: false, error: "No cookies received from login page" }
        }

        const tokenMatch = htmlContent.match(
            /<input[^>]*name="__RequestVerificationToken"[^>]*value="([^"]+)"/
        )
        if (!tokenMatch) {
            return { success: false, error: "Could not extract verification token from HTML" }
        }
        const verificationToken = tokenMatch[1]

        const antiforgeryToken = setCookieHeader.match(
            /\.AspNetCore\.Antiforgery\.[^=]+=([^;]+)/
        )?.[1]
        if (!antiforgeryToken) {
            return { success: false, error: "Could not extract antiforgery token" }
        }

        const cookies = setCookieHeader
            .split(",")
            .map((c) => c.trim().split(";")[0])
            .join("; ")

        const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2, 15)}`
        const formData = [
            `--${boundary}`,
            `Content-Disposition: form-data; name="pass"`,
            "",
            password,
            `--${boundary}`,
            `Content-Disposition: form-data; name="email"`,
            "",
            username,
            `--${boundary}--`,
        ].join("\r\n")

        const loginResponse = await fetch("https://urnik.net/Account/Login?handler=Login", {
            method: "POST",
            headers: {
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
                "User-Agent":
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
                Cookie: cookies,
                requestverificationtoken: verificationToken,
                "X-Requested-With": "XMLHttpRequest",
                Origin: "https://urnik.net",
                Referer: "https://urnik.net/Account/Login",
            },
            body: formData,
        })

        if (!loginResponse.ok) {
            return {
                success: false,
                error: `Login request failed: ${loginResponse.status}`,
            }
        }

        const responseText = await loginResponse.text()
        let responseData
        try {
            responseData = JSON.parse(responseText)
        } catch {
            return { success: false, error: "Invalid response format from server" }
        }

        if (!responseData.res) {
            return {
                success: false,
                error: "Login failed with invalid credentials",
            }
        }

        const authCookie = loginResponse.headers.get("set-cookie")
        if (!authCookie) {
            return { success: false, error: "No authentication cookie received" }
        }

        const sessionCookie = authCookie
            .split(",")
            .find((c) => c.includes(".AspNetCore.Cookies"))
            ?.split(";")[0]

        if (!sessionCookie) {
            return { success: false, error: "Session cookie not found in response" }
        }

        const langResponse = await fetch(
            "https://urnik.net/App/Main?handler=ChangeLang&culture=en-US&returnUrl=/App/MyRequests/MyRequests",
            {
                method: "GET",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
                    Cookie: sessionCookie,
                    "X-Requested-With": "XMLHttpRequest",
                },
                redirect: "manual",
            }
        )

        let finalCookie = sessionCookie
        const cultureCookie = langResponse.headers.get("set-cookie")
        if (cultureCookie) {
            const cultureValue = cultureCookie
                .split(",")
                .find((c) => c.includes(".AspNetCore.Culture"))
                ?.split(";")[0]
            if (cultureValue) {
                finalCookie = `${sessionCookie}; ${cultureValue}`
            }
        }

        return { success: true, cookie: finalCookie }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

export async function attemptUrnikLogin() {
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

    const result = await loginToUrnik(user.urnikUsername, user.urnikPassword)

    if (result.success) {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { lastUrnikTestAt: new Date() },
        })
    }

    return result
}

export async function fetchUrnikRequests(month?: string) {
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

    const loginResult = await loginToUrnik(user.urnikUsername, user.urnikPassword)

    if (!loginResult.success || !loginResult.cookie) {
        return { success: false, error: loginResult.error || "Login failed" }
    }

    try {
        const response = await fetch(
            "https://urnik.net/App/MyRequests/MyRequests?handler=LoadRequests",
            {
                method: "GET",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
                    Cookie: loginResult.cookie,
                },
            }
        )

        if (!response.ok) {
            return { success: false, error: `Failed to fetch requests: ${response.status}` }
        }

        const html = await response.text()
        const parsed = parseUrnikRequestsHtml(html)

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
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

export async function calculatePendingRequests(
    input: GetPendingRequestsInput
): Promise<{ success: boolean; data?: PendingUrnikRequest[]; error?: string }> {
    try {
        const session = await requireAuth()

        const validation = GetPendingRequestsInputSchema.safeParse(input)
        if (!validation.success) {
            return { success: false, error: validation.error.message }
        }

        const { startDate, endDate } = validation.data

        const startDateObj = new Date(startDate)
        startDateObj.setHours(0, 0, 0, 0)
        const endDateObj = new Date(endDate)
        endDateObj.setHours(23, 59, 59, 999)

        const entries = await prisma.taskTimeEntry.findMany({
            where: {
                userId: session.user.id,
                startTime: {
                    gte: startDateObj,
                    lte: endDateObj,
                },
                endTime: {
                    not: null,
                },
                type: {
                    in: ["WORK", "WORK_FROM_HOME"],
                },
            },
            orderBy: {
                startTime: "asc",
            },
        })

        const dailyRanges = new Map<
            string,
            {
                date: Date
                firstStart: Date
                lastEnd: Date
                type: "WORK" | "WORK_FROM_HOME"
            }
        >()

        for (const entry of entries) {
            if (!entry.endTime) continue

            const dateKey = entry.startTime.toISOString().split("T")[0]
            const existing = dailyRanges.get(dateKey)
            const entryType = entry.type as HourType

            if (entryType !== "WORK" && entryType !== "WORK_FROM_HOME") continue

            if (!existing) {
                dailyRanges.set(dateKey, {
                    date: new Date(entry.startTime),
                    firstStart: entry.startTime,
                    lastEnd: entry.endTime,
                    type: entryType,
                })
            } else {
                if (entry.startTime < existing.firstStart) {
                    existing.firstStart = entry.startTime
                }
                if (entry.endTime > existing.lastEnd) {
                    existing.lastEnd = entry.endTime
                }
                if (entryType === "WORK" && existing.type === "WORK_FROM_HOME") {
                    existing.type = "WORK"
                }
            }
        }

        const pendingRequests: PendingUrnikRequest[] = Array.from(dailyRanges.values()).map(
            (range) => {
                const startHours = String(range.firstStart.getHours()).padStart(2, "0")
                const startMinutes = String(range.firstStart.getMinutes()).padStart(2, "0")
                const endHours = String(range.lastEnd.getHours()).padStart(2, "0")
                const endMinutes = String(range.lastEnd.getMinutes()).padStart(2, "0")

                const hours =
                    (range.lastEnd.getTime() - range.firstStart.getTime()) / (1000 * 60 * 60)

                const dateOnly = new Date(range.date)
                dateOnly.setHours(0, 0, 0, 0)

                return {
                    date: dateOnly,
                    startTime: `${startHours}:${startMinutes}`,
                    endTime: `${endHours}:${endMinutes}`,
                    hours: Math.round(hours * 100) / 100,
                    type: range.type,
                    isPending: true as const,
                }
            }
        )

        return { success: true, data: pendingRequests }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to calculate pending requests",
        }
    }
}

export async function submitPendingRequestToUrnik(
    pendingRequest: PendingUrnikRequest
): Promise<{ success: boolean; trackingId?: string; error?: string }> {
    try {
        const session = await requireAuth()

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { urnikUsername: true, urnikPassword: true },
        })

        if (!user?.urnikUsername || !user?.urnikPassword) {
            return { success: false, error: "Urnik.net credentials not configured" }
        }

        const loginResult = await loginToUrnik(user.urnikUsername, user.urnikPassword)
        if (!loginResult.success || !loginResult.cookie) {
            return { success: false, error: loginResult.error || "Authentication failed" }
        }

        const urnikRequest = await prisma.urnikRequest.create({
            data: {
                userId: session.user.id,
                date: pendingRequest.date,
                startTime: pendingRequest.startTime,
                endTime: pendingRequest.endTime,
                hours: pendingRequest.hours,
                type: pendingRequest.type,
                urnikType: pendingRequest.type === "WORK" ? 110 : 124,
                status: "PENDING",
            },
        })

        const year = pendingRequest.date.getFullYear()
        const month = String(pendingRequest.date.getMonth() + 1).padStart(2, "0")
        const day = String(pendingRequest.date.getDate()).padStart(2, "0")
        const dateTime = `${year}/${month}/${day}`

        const url = new URL("https://urnik.net/App/Main")
        url.searchParams.append("handler", "SaveRequestHours")
        url.searchParams.append("timeStart", pendingRequest.startTime)
        url.searchParams.append("timeEnd", pendingRequest.endTime)
        url.searchParams.append("dateTime", dateTime)
        url.searchParams.append("type", String(urnikRequest.urnikType))
        url.searchParams.append("comment", urnikRequest.id)

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
                Cookie: loginResult.cookie,
                Accept: "*/*",
                "Accept-Language": "en-GB,en;q=0.9,sl;q=0.8",
                "X-Requested-With": "XMLHttpRequest",
                Referer: "https://urnik.net/App/Main",
            },
        })

        if (!response.ok) {
            await prisma.urnikRequest.update({
                where: { id: urnikRequest.id },
                data: {
                    status: "FAILED",
                    errorMessage: `HTTP ${response.status}: ${response.statusText}`,
                },
            })
            return {
                success: false,
                error: `Request failed with status ${response.status}`,
            }
        }

        return { success: true, trackingId: urnikRequest.id }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to submit request",
        }
    } finally {
        revalidatePath("/urnik-sync")
    }
}

export async function syncUrnikStatuses(): Promise<{
    success: boolean
    syncedCount?: number
    error?: string
}> {
    try {
        const session = await requireAuth()

        let urnikRequestsResult = await fetchUrnikRequests()

        if (!urnikRequestsResult.success) {
            const loginResult = await attemptUrnikLogin()
            if (!loginResult.success) {
                return { success: false, error: "Authentication failed" }
            }

            urnikRequestsResult = await fetchUrnikRequests()
            if (!urnikRequestsResult.success) {
                return { success: false, error: urnikRequestsResult.error }
            }
        }

        const urnikRequests = urnikRequestsResult.data || []
        const pendingRequests = await prisma.urnikRequest.findMany({
            where: {
                userId: session.user.id,
                status: "PENDING",
            },
        })

        let syncedCount = 0
        const cuidPattern = /\b(c[a-z0-9]{24})\b/i

        for (const urnikReq of urnikRequests) {
            const match = urnikReq.notes.match(cuidPattern)
            if (!match) continue

            const trackingId = match[1]
            const localRequest = pendingRequests.find((req) => req.id === trackingId)
            if (!localRequest) continue

            let newStatus: "CONFIRMED" | "REJECTED" | null = null
            if (urnikReq.status.toLowerCase().includes("confirm")) {
                newStatus = "CONFIRMED"
            } else if (
                urnikReq.status.toLowerCase().includes("cancel") ||
                urnikReq.status.toLowerCase().includes("reject")
            ) {
                newStatus = "REJECTED"
            }

            if (newStatus) {
                await prisma.urnikRequest.update({
                    where: { id: localRequest.id },
                    data: {
                        status: newStatus,
                        confirmedAt: newStatus === "CONFIRMED" ? new Date() : undefined,
                        urnikRequestNo: urnikReq.no,
                    },
                })
                syncedCount++
            }
        }

        return { success: true, syncedCount }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to sync statuses",
        }
    }
}

export async function getSubmittedRequests() {
    try {
        const session = await requireAuth()

        const submittedRequests = await prisma.urnikRequest.findMany({
            where: { userId: session.user.id },
            orderBy: { date: "desc" },
            select: {
                id: true,
                date: true,
                startTime: true,
                endTime: true,
                hours: true,
                type: true,
                urnikType: true,
                status: true,
                submittedAt: true,
                confirmedAt: true,
                errorMessage: true,
                urnikRequestNo: true,
            },
        })

        return { success: true, data: submittedRequests }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch submitted requests",
        }
    }
}
