import type { ParsedAttendanceResult, UserStatus } from "../schemas/attendance-schema"
import { getErrorMessage } from "../../utils/helpers"

function decodeHtmlEntities(text: string): string {
    return text.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function findMatchingCloseDiv(html: string, openIndex: number): number {
    let depth = 1
    let pos = openIndex

    while (pos < html.length) {
        const nextOpen = html.indexOf("<div", pos)
        const nextClose = html.indexOf("</div>", pos)

        if (nextOpen !== -1 && nextOpen < nextClose) {
            depth++
            pos = nextOpen + 4
        } else if (nextClose !== -1) {
            depth--
            if (depth === 0) {
                return nextClose + 6
            }
            pos = nextClose + 6
        } else {
            return -1
        }
    }

    return -1
}

function extractUsersBySection(html: string): {
    presentUsers: UserStatus[]
    absentUsers: UserStatus[]
} {
    const presentUsers: UserStatus[] = []
    const absentUsers: UserStatus[] = []

    const absentHeadingIndex = html.indexOf('<p class="small_title">Absent</p>')
    const openTag = '<div class="userStatusDiv">'
    let searchFrom = 0

    while (true) {
        const openIndex = html.indexOf(openTag, searchFrom)
        if (openIndex === -1) break

        const contentStart = openIndex + openTag.length
        const closeEnd = findMatchingCloseDiv(html, contentStart)
        if (closeEnd === -1) break

        const userHtml = html.slice(contentStart, closeEnd - 6)

        const nameMatch = userHtml.match(/<div class="userStatusName">([^<]+)<\/div>/)
        if (!nameMatch) {
            searchFrom = closeEnd
            continue
        }

        const statMatch = userHtml.match(/<div class="userStatusStat">\s*([^<]+)\s*<\/div>/)
        if (!statMatch) {
            searchFrom = closeEnd
            continue
        }

        const classMatch = userHtml.match(/class="userStatusImage (BC-\d+)"/)
        const colorClass = classMatch ? classMatch[1] : "BC-99"

        const imgMatch = userHtml.match(/<img[^>]*src="([^"]+)"[^>]*\/>/)
        const imageUrl = imgMatch ? "https://urnik.net" + imgMatch[1] : null

        const rawName = nameMatch[1].trim()
        const name = decodeHtmlEntities(rawName)
        const rawStatus = statMatch[1].trim()
        const status = decodeHtmlEntities(rawStatus) as UserStatus["status"]

        const user: UserStatus = { name, status, colorClass, imageUrl }

        if (absentHeadingIndex !== -1 && openIndex > absentHeadingIndex) {
            absentUsers.push(user)
        } else {
            presentUsers.push(user)
        }

        searchFrom = closeEnd
    }

    return { presentUsers, absentUsers }
}

export function parseAttendanceHtml(html: string): ParsedAttendanceResult {
    try {
        if (!html.includes("Team status")) {
            return {
                success: false,
                error: "Missing 'Team status' heading - HTML structure may have changed",
                structureValid: false,
            }
        }

        if (!html.includes("Present") && !html.includes("Absent")) {
            return {
                success: false,
                error: "Missing 'Present' or 'Absent' sections - HTML structure may have changed",
                structureValid: false,
            }
        }

        if (!html.includes("userStatusDiv")) {
            return {
                success: false,
                error: "No user status cards found - HTML structure may have changed",
                structureValid: false,
            }
        }

        const { presentUsers, absentUsers } = extractUsersBySection(html)

        if (presentUsers.length === 0 && absentUsers.length === 0) {
            return {
                success: false,
                error: "No users found in Present or Absent sections",
                structureValid: false,
            }
        }

        return {
            success: true,
            data: { present: presentUsers, absent: absentUsers },
            structureValid: true,
        }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to parse attendance HTML"),
            structureValid: false,
        }
    }
}
