"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getUrnikCookie } from "@/lib/urnik-session"
import {
    CreateUrnikNetDayRequestSchema,
    type CreateUrnikNetDayRequestInput,
} from "../schemas/create-urnik-net-day-request-schema"

const URNIK_TENANT_ID = process.env.URNIK_TENANT_ID ?? ""

async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}

function formatDateDDMMYYYY(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
}

async function extractCsrfToken(cookie: string): Promise<string | null> {
    try {
        const response = await fetch("https://urnik.net/App/Main", {
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
                Cookie: cookie,
                Accept: "text/html",
                "Accept-Language": "en-GB,en;q=0.9,sl;q=0.8",
            },
        })

        if (!response.ok) {
            return null
        }

        const html = await response.text()
        const tokenMatch = html.match(
            /<input[^>]*name="__RequestVerificationToken"[^>]*value="([^"]+)"/
        )

        return tokenMatch ? tokenMatch[1] : null
    } catch {
        return null
    }
}

async function submitVacationRequest(
    cookie: string,
    urnikUserId: string,
    startDate: Date,
    endDate: Date,
    comment: string
): Promise<{ success: boolean; error?: string }> {
    const startUnix = Math.floor(startDate.getTime() / 1000)
    const endUnix = Math.floor(endDate.getTime() / 1000)

    const url = new URL("https://urnik.net/App/Vacation/Vacation")
    url.searchParams.append("handler", "SaveSimpleVac")
    url.searchParams.append("UserID", urnikUserId)
    url.searchParams.append("start", String(startUnix))
    url.searchParams.append("end", String(endUnix))
    url.searchParams.append("comment", comment)

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "User-Agent":
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
            Cookie: cookie,
            Accept: "*/*",
            "Accept-Language": "en-GB,en;q=0.9,sl;q=0.8",
            "X-Requested-With": "XMLHttpRequest",
            Referer: "https://urnik.net/App/Vacation/Vacation",
        },
    })

    if (!response.ok) {
        return { success: false, error: `Urnik.net returned ${response.status}` }
    }

    return { success: true }
}

async function submitSickLeaveRequest(
    cookie: string,
    csrfToken: string,
    urnikUserId: string,
    startDate: Date,
    endDate: Date,
    comment: string
): Promise<{ success: boolean; error?: string }> {
    const formData = new FormData()
    formData.append("SickdayType", "4")
    formData.append("startDate", formatDateDDMMYYYY(startDate))
    formData.append("endDate", formatDateDDMMYYYY(endDate))
    formData.append("Duration", "1")
    formData.append("__Invariant", "Duration")
    formData.append("Description", comment)
    formData.append("TenantID", URNIK_TENANT_ID)
    formData.append("UserID", urnikUserId)
    formData.append("__RequestVerificationToken", csrfToken)

    const response = await fetch("https://urnik.net/App/Main?handler=SaveSickdayRequest", {
        method: "POST",
        headers: {
            "User-Agent":
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
            Cookie: cookie,
            Accept: "*/*",
            "Accept-Language": "en-GB,en;q=0.9,sl;q=0.8",
            "X-Requested-With": "XMLHttpRequest",
            Referer: "https://urnik.net/App/Main",
        },
        body: formData,
    })

    if (!response.ok) {
        return { success: false, error: `Urnik.net returned ${response.status}` }
    }

    return { success: true }
}

async function submitWorkFromHomeRequest(
    cookie: string,
    csrfToken: string,
    urnikUserId: string,
    startDate: Date,
    endDate: Date,
    comment: string
): Promise<{ success: boolean; error?: string }> {
    const formData = new FormData()
    formData.append("startDate", formatDateDDMMYYYY(startDate))
    formData.append("endDate", formatDateDDMMYYYY(endDate))
    formData.append("Duration", "1")
    formData.append("__Invariant", "Duration")
    formData.append("Description", comment)
    formData.append("TenantID", URNIK_TENANT_ID)
    formData.append("UserID", urnikUserId)
    formData.append("__RequestVerificationToken", csrfToken)

    const response = await fetch("https://urnik.net/App/Main?handler=SaveWHRequest", {
        method: "POST",
        headers: {
            "User-Agent":
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
            Cookie: cookie,
            Accept: "*/*",
            "Accept-Language": "en-GB,en;q=0.9,sl;q=0.8",
            "X-Requested-With": "XMLHttpRequest",
            Referer: "https://urnik.net/App/Main",
        },
        body: formData,
    })

    if (!response.ok) {
        return { success: false, error: `Urnik.net returned ${response.status}` }
    }

    return { success: true }
}

export async function createUrnikNetDayRequest(
    input: CreateUrnikNetDayRequestInput
): Promise<{ success: boolean; trackingId?: string; error?: string }> {
    try {
        const session = await requireAuth()

        const validation = CreateUrnikNetDayRequestSchema.safeParse(input)
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.issues[0]?.message || "Validation failed",
            }
        }

        const { type, startDate, endDate, comment } = validation.data

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                urnikUsername: true,
                urnikPassword: true,
                urnikUserId: true,
            },
        })

        if (!user?.urnikUsername || !user?.urnikPassword) {
            return { success: false, error: "Urnik.net credentials not configured" }
        }

        const cookie = await getUrnikCookie()
        if (!cookie) {
            return { success: false, error: "Authentication failed" }
        }

        const urnikUserId =
            user.urnikUserId ||
            (await prisma.user
                .findUnique({ where: { id: session.user.id }, select: { urnikUserId: true } })
                .then((u) => u?.urnikUserId ?? null))

        if (!urnikUserId) {
            return {
                success: false,
                error: "Urnik.net user ID not available. Please test your connection in profile settings.",
            }
        }

        const record = await prisma.urnikRequest.create({
            data: {
                userId: session.user.id,
                category: "DAY",
                date: startDate,
                endDate,
                type,
                status: "PENDING",
            },
        })

        let result: { success: boolean; error?: string }

        if (type === "VACATION") {
            result = await submitVacationRequest(
                cookie,
                urnikUserId,
                startDate,
                endDate,
                comment || record.id
            )
        } else {
            const csrfToken = await extractCsrfToken(cookie)
            if (!csrfToken) {
                await prisma.urnikRequest.update({
                    where: { id: record.id },
                    data: { status: "FAILED", errorMessage: "Could not extract CSRF token" },
                })
                return { success: false, error: "Could not extract CSRF token from Urnik.net" }
            }

            if (type === "SICK_LEAVE") {
                result = await submitSickLeaveRequest(
                    cookie,
                    csrfToken,
                    urnikUserId,
                    startDate,
                    endDate,
                    comment || record.id
                )
            } else {
                result = await submitWorkFromHomeRequest(
                    cookie,
                    csrfToken,
                    urnikUserId,
                    startDate,
                    endDate,
                    comment || record.id
                )
            }
        }

        if (!result.success) {
            await prisma.urnikRequest.update({
                where: { id: record.id },
                data: { status: "FAILED", errorMessage: result.error },
            })
            return { success: false, error: result.error }
        }

        revalidatePath("/urnik-net-overview/requests")
        return { success: true, trackingId: record.id }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}
