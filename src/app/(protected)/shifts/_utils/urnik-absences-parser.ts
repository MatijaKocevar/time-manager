import { URNIK_ABSENCE_BADGE, type UrnikAbsenceBadge } from "../_schemas/urnik-absence-schemas"

const URNIK_ABSENCE_CODE_TO_BADGE: Record<string, UrnikAbsenceBadge> = {
    DeloOdDoma: URNIK_ABSENCE_BADGE.HOME,
    KoriščenjeNadur: URNIK_ABSENCE_BADGE.OVERTIME_USE,
    ProsteUre: URNIK_ABSENCE_BADGE.OVERTIME_USE,
    ProstiČas: URNIK_ABSENCE_BADGE.BREAK,
    TerenskoDelo: URNIK_ABSENCE_BADGE.OFFICE,
    SlužbenaPot: URNIK_ABSENCE_BADGE.OFFICE,
    Izobrazevanje: URNIK_ABSENCE_BADGE.OFFICE,
    Nedosegljiv: URNIK_ABSENCE_BADGE.ABSENCE,
}

export interface UrnikEmployeeAbsenceDay {
    day: number
    badge: UrnikAbsenceBadge
}

export interface UrnikEmployeeAbsences {
    urnikUserId: string | null
    name: string
    days: UrnikEmployeeAbsenceDay[]
}

export interface ParseUrnikAbsencesResult {
    success: boolean
    data?: UrnikEmployeeAbsences[]
    error?: string
    structureValid: boolean
}

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, decimal) => String.fromCharCode(parseInt(decimal, 10)))
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
}

function getBadgeFromCellContent(content: string): UrnikAbsenceBadge | null {
    if (content.includes("fa-island-tropical")) {
        return URNIK_ABSENCE_BADGE.VACATION
    }

    if (content.includes("thermometer")) {
        return URNIK_ABSENCE_BADGE.SICK_LEAVE
    }

    if (content.includes("circle-location-arrow")) {
        return URNIK_ABSENCE_BADGE.ABSENCE
    }

    const codeMatch = content.match(/<span>([\s\S]*?)<\/span>/)

    if (!codeMatch) {
        return null
    }

    const code = decodeHtmlEntities(codeMatch[1]).trim()

    if (!code) {
        return null
    }

    return URNIK_ABSENCE_CODE_TO_BADGE[code] ?? URNIK_ABSENCE_BADGE.ABSENCE
}

export function parseUrnikAbsencesHtml(html: string): ParseUrnikAbsencesResult {
    try {
        const tableMatch = html.match(/<table[^>]*class="calendarTable"[^>]*>([\s\S]*?)<\/table>/)

        if (!tableMatch) {
            return {
                success: false,
                error: "Absences table not found - HTML structure may have changed",
                structureValid: false,
            }
        }

        const theadMatch = tableMatch[1].match(/<thead>([\s\S]*?)<\/thead>/)
        const tbodyMatch = tableMatch[1].match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/)

        if (!theadMatch || !tbodyMatch) {
            return {
                success: false,
                error: "Absences table header or body not found - HTML structure may have changed",
                structureValid: false,
            }
        }

        const headerCellCount = [...theadMatch[1].matchAll(/<th[^>]*>/g)].length

        if (headerCellCount < 3) {
            return {
                success: false,
                error: "Absences table has no day columns - HTML structure may have changed",
                structureValid: false,
            }
        }

        const rowMatches = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
        const employees: UrnikEmployeeAbsences[] = []

        for (const rowMatch of rowMatches) {
            const row = rowMatch[1]
            const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]

            if (cells.length < 3) {
                continue
            }

            const nameMatch = cells[0][1].match(/<span>([\s\S]*?)<\/span>/)

            if (!nameMatch) {
                continue
            }

            const name = decodeHtmlEntities(nameMatch[1]).trim()
            const userIdMatch = row.match(/loadEditDay\('([0-9a-f-]+)'/)
            const days: UrnikEmployeeAbsenceDay[] = []

            for (let index = 1; index <= cells.length - 2; index++) {
                const badge = getBadgeFromCellContent(cells[index][1])

                if (badge) {
                    days.push({ day: index, badge })
                }
            }

            employees.push({
                urnikUserId: userIdMatch ? userIdMatch[1] : null,
                name,
                days,
            })
        }

        if (employees.length === 0) {
            return {
                success: false,
                error: "No employee rows found - HTML structure may have changed",
                structureValid: false,
            }
        }

        return { success: true, data: employees, structureValid: true }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to parse absences HTML",
            structureValid: false,
        }
    }
}
