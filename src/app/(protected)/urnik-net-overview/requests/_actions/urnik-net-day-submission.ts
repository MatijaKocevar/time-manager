"use server"

import { URNIK_USER_AGENT } from "../../_utils/constants"
import { calculateWorkDays, formatDateDDMMYYYY } from "../../_utils/date-helpers"

const URNIK_TENANT_ID = process.env.URNIK_TENANT_ID ?? ""

export async function extractCsrfToken(
    cookie: string
): Promise<{ token: string; antiforgery: string } | null> {
    try {
        const response = await fetch("https://urnik.net/App/Main", {
            method: "GET",
            headers: {
                "User-Agent": URNIK_USER_AGENT,
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
        if (!tokenMatch) {
            return null
        }

        const setCookie = response.headers.get("set-cookie") ?? ""
        const antiforgeryCookie = setCookie
            .split(",")
            .map((c) => c.trim().split(";")[0])
            .find((c) => c.includes(".AspNetCore.Antiforgery"))

        if (!antiforgeryCookie) {
            return null
        }

        return { token: tokenMatch[1], antiforgery: antiforgeryCookie }
    } catch {
        return null
    }
}

export async function submitVacationToUrnikNet(
    cookie: string,
    urnikUserId: string,
    startDate: Date,
    endDate: Date,
    trackingId: string
): Promise<{ success: boolean; error?: string }> {
    const startUnix = Math.floor(startDate.getTime() / 1000)
    const endUnix = Math.floor(endDate.getTime() / 1000)

    const url = new URL("https://urnik.net/App/Vacation/Vacation")
    url.searchParams.append("handler", "SaveSimpleVac")
    url.searchParams.append("UserID", urnikUserId)
    url.searchParams.append("start", String(startUnix))
    url.searchParams.append("end", String(endUnix))
    url.searchParams.append("comment", trackingId)

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "User-Agent": URNIK_USER_AGENT,
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

export async function submitSickLeaveToUrnikNet(
    cookie: string,
    csrfToken: string,
    antiforgeryCookie: string,
    urnikUserId: string,
    startDate: Date,
    endDate: Date,
    trackingId: string
): Promise<{ success: boolean; error?: string }> {
    const formData = new FormData()
    formData.append("SickdayType", "4")
    formData.append("startDate", formatDateDDMMYYYY(startDate))
    formData.append("endDate", formatDateDDMMYYYY(endDate))
    formData.append("Duration", String(calculateWorkDays(startDate, endDate)))
    formData.append("Description", trackingId)
    formData.append("TenantID", URNIK_TENANT_ID)
    formData.append("UserID", urnikUserId)
    formData.append("__RequestVerificationToken", csrfToken)

    const response = await fetch("https://urnik.net/App/Main?handler=SaveSickdayRequest", {
        method: "POST",
        headers: {
            "User-Agent": URNIK_USER_AGENT,
            Cookie: `${cookie}; ${antiforgeryCookie}`,
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

export async function submitWorkFromHomeToUrnikNet(
    cookie: string,
    csrfToken: string,
    antiforgeryCookie: string,
    urnikUserId: string,
    startDate: Date,
    endDate: Date,
    trackingId: string
): Promise<{ success: boolean; error?: string }> {
    const formData = new FormData()
    formData.append("startDate", formatDateDDMMYYYY(startDate))
    formData.append("endDate", formatDateDDMMYYYY(endDate))
    formData.append("Duration", String(calculateWorkDays(startDate, endDate)))
    formData.append("__Invariant", "Duration")
    formData.append("Description", trackingId)
    formData.append("TenantID", URNIK_TENANT_ID)
    formData.append("UserID", urnikUserId)
    formData.append("__RequestVerificationToken", csrfToken)

    const response = await fetch("https://urnik.net/App/Main?handler=SaveWHRequest", {
        method: "POST",
        headers: {
            "User-Agent": URNIK_USER_AGENT,
            Cookie: `${cookie}; ${antiforgeryCookie}`,
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
