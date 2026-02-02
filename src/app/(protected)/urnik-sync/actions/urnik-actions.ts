"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

export async function fetchUrnikRequests() {
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

        return { success: true, data: parsed.data }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}
