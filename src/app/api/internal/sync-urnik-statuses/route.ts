import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { URNIK_USER_AGENT } from "@/app/(protected)/urnik-net-overview/lib/constants"
import { loginToUrnikNet } from "@/app/(protected)/urnik-net-overview/requests/actions/urnik-net-auth"
import {
    systemApproveRequest,
    systemRejectRequest,
} from "@/app/(protected)/requests/actions/request-actions"

const TRACKING_ID_REGEX = /\b(c[a-z0-9]{24})\b/i

function parseStatusesFromHtml(html: string): Array<{ trackingId: string; status: string }> {
    const results: Array<{ trackingId: string; status: string }> = []

    const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/)
    if (!tbodyMatch) return results

    const rowMatches = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]

    for (const rowMatch of rowMatches) {
        const cellMatches = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
        if (cellMatches.length < 17) continue

        const getCellText = (index: number) => {
            const cell = cellMatches[index]?.[1] || ""
            return cell
                .replace(/<[^>]*>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
                .trim()
        }

        const notes = getCellText(16)
        const status = getCellText(14)

        const match = TRACKING_ID_REGEX.exec(notes)
        if (match) {
            results.push({ trackingId: match[1], status })
        }
    }

    return results
}

export async function GET(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
        return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
    }

    const authHeader = request.headers.get("authorization")
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pendingUrnikRequests = await prisma.request.findMany({
        where: {
            urnikNetSynced: true,
            status: "PENDING",
            urnikNetStatus: "PENDING",
        },
        select: {
            id: true,
            userId: true,
        },
    })

    if (pendingUrnikRequests.length === 0) {
        return NextResponse.json({ synced: 0, message: "No pending urnik requests" })
    }

    const byUser = new Map<string, string[]>()
    for (const req of pendingUrnikRequests) {
        const list = byUser.get(req.userId) ?? []
        list.push(req.id)
        byUser.set(req.userId, list)
    }

    let synced = 0
    const errors: string[] = []

    for (const [userId, requestIds] of byUser) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { urnikUsername: true, urnikPassword: true },
        })

        if (!user?.urnikUsername || !user?.urnikPassword) {
            errors.push(`User ${userId}: no urnik credentials`)
            continue
        }

        const loginResult = await loginToUrnikNet(user.urnikUsername, user.urnikPassword)
        if (!loginResult.success || !loginResult.cookie) {
            errors.push(`User ${userId}: login failed - ${loginResult.error}`)
            continue
        }

        let html: string
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
                errors.push(`User ${userId}: fetch failed - ${response.status}`)
                continue
            }
            html = await response.text()
        } catch (err) {
            errors.push(`User ${userId}: fetch error - ${String(err)}`)
            continue
        }

        const statusRows = parseStatusesFromHtml(html)

        for (const requestId of requestIds) {
            const row = statusRows.find((r) => r.trackingId === requestId)
            if (!row) continue

            const normalizedStatus = row.status.toLowerCase()

            if (normalizedStatus.includes("confirm")) {
                const result = await systemApproveRequest(requestId)
                if ("error" in result) {
                    errors.push(`Request ${requestId}: approve failed - ${result.error}`)
                } else {
                    synced++
                }
            } else if (normalizedStatus.includes("cancel") || normalizedStatus.includes("reject")) {
                const result = await systemRejectRequest(
                    requestId,
                    `Urnik.net status: ${row.status}`
                )
                if ("error" in result) {
                    errors.push(`Request ${requestId}: reject failed - ${result.error}`)
                } else {
                    synced++
                }
            }
        }
    }

    return NextResponse.json({ synced, errors: errors.length > 0 ? errors : undefined })
}
