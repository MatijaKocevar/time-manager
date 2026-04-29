import type {
    ParsedHoursResult,
    DayEntry,
    MonthSummary,
    ValidationWarning,
} from "../schemas/hours-schema"
import { getErrorMessage } from "../../utils/helpers"

function cleanText(text: string): string {
    return text
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .trim()
}

function extractTextBetween(html: string, before: string): string | null {
    const directTextRegex = new RegExp(`${before}\\s*</b>\\s*([^<]+)`, "i")
    const directMatch = html.match(directTextRegex)

    if (directMatch && directMatch[1].trim() !== "") {
        return cleanText(directMatch[1])
    }

    const spanRegex = new RegExp(`${before}\\s*</b>\\s*<span[^>]*>([^<]+)</span>`, "i")
    const spanMatch = html.match(spanRegex)

    if (spanMatch) {
        return cleanText(spanMatch[1])
    }

    const nextLineSpanRegex = new RegExp(
        `${before}\\s*</b>\\s*[\\s\\n]*<span[^>]*>([^<]+)</span>`,
        "i"
    )
    const nextLineMatch = html.match(nextLineSpanRegex)

    if (nextLineMatch) {
        return cleanText(nextLineMatch[1])
    }

    return null
}

function validateHtmlStructure(html: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = []

    const expectedSummaryFields = [
        "Billing hours:",
        "Planned:",
        "Work days:",
        "Holidays:",
        "Vacation balance:",
        "Balance:",
        "Work from home:",
    ]

    for (const field of expectedSummaryFields) {
        if (!html.includes(field)) {
            warnings.push({
                field: "summary",
                message: `Missing expected summary field: "${field}"`,
                severity: "warning",
            })
        }
    }

    if (!html.includes("<tbody")) {
        warnings.push({
            field: "table",
            message: "Missing expected <tbody> element for day entries",
            severity: "error",
        })
    }

    if (!html.includes('id="position"')) {
        warnings.push({
            field: "table",
            message: 'Missing expected tbody id="position" - table structure may have changed',
            severity: "warning",
        })
    }

    const expectedHeaders = ["Date", "Day", "Status", "Clock In", "Clock Out", "Attendance"]
    for (const header of expectedHeaders) {
        if (!html.includes(header)) {
            warnings.push({
                field: "table",
                message: `Missing expected table header: "${header}"`,
                severity: "warning",
            })
        }
    }

    const criticalColumns = ["Clock In", "Clock Out"]
    let missingCriticalColumns = 0
    for (const col of criticalColumns) {
        if (!html.includes(col)) {
            missingCriticalColumns++
        }
    }

    if (missingCriticalColumns === criticalColumns.length) {
        warnings.push({
            field: "table",
            message:
                "Critical table columns missing - HTML structure may have fundamentally changed",
            severity: "error",
        })
    }

    return warnings
}

function parseSummary(html: string): MonthSummary {
    let summarySection =
        html.match(
            /<div class="row"[^>]*margin-left:\s*20px[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*width:\s*100%[^>]*display:\s*inline-flex/i
        )?.[1] || ""

    if (!summarySection || summarySection.length < 50) {
        summarySection = html
    }

    return {
        billingHours: extractTextBetween(summarySection, "<b>Billing hours:"),
        plannedHours: extractTextBetween(summarySection, "<b>Planned:"),
        workDays: extractTextBetween(summarySection, "<b>Work days:"),
        holidays: extractTextBetween(summarySection, "<b>Holidays:"),
        lunches: extractTextBetween(summarySection, "<b>Lunches:"),
        vacationBalance: extractTextBetween(summarySection, "<b>Vacation balance:"),
        sickLeave: extractTextBetween(summarySection, "<b>Sick leave:"),
        leaveDays: extractTextBetween(summarySection, "<b>Leave:"),
        balance: extractTextBetween(summarySection, "<b>Balance:"),
        workFromHome: extractTextBetween(summarySection, "<b>Work from home:"),
        userType: extractTextBetween(summarySection, "<b>User type"),
        hoursInDay: extractTextBetween(summarySection, "<b>Hours in day:"),
    }
}

function parseDayEntries(html: string): DayEntry[] {
    const days: DayEntry[] = []

    const tbodyMatch = html.match(/<tbody[^>]*id="position">([\s\S]*?)<\/tbody>/)
    if (!tbodyMatch) {
        return days
    }

    const rowMatches = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]

    for (const rowMatch of rowMatches) {
        const row = rowMatch[1]
        const cellMatches = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]

        if (cellMatches.length < 20) {
            continue
        }

        const getCellText = (index: number): string | null => {
            const cell = cellMatches[index]?.[1] || ""
            const text = cleanText(cell)
            return text === "" || text === "Ni podatka" ? null : text
        }

        const numberText = getCellText(0)
        const number = numberText ? parseInt(numberText.replace(".", "")) : 0

        days.push({
            number,
            date: getCellText(1) || "",
            dayOfWeek: getCellText(2) || "",
            status: getCellText(3) || "",
            clockIn: getCellText(5),
            clockOut: getCellText(6),
            attendance: getCellText(10),
            accounted: getCellText(11),
            dayBalance: getCellText(18),
            balanceMonth: getCellText(20),
            balanceYear: getCellText(21),
        })
    }

    return days
}

export function parseHoursHtml(html: string): ParsedHoursResult {
    try {
        const validationWarnings = validateHtmlStructure(html)

        const criticalErrors = validationWarnings.filter((w) => w.severity === "error")
        if (criticalErrors.length > 0) {
            return {
                success: false,
                error: `HTML structure validation failed: ${criticalErrors.map((e) => e.message).join(", ")}`,
                validationWarnings,
            }
        }

        const summary = parseSummary(html)
        const days = parseDayEntries(html)

        if (days.length === 0) {
            validationWarnings.push({
                field: "data",
                message: "No day entries found - HTML parsing may have failed",
                severity: "error",
            })

            return {
                success: false,
                error: "No day entries found in HTML",
                validationWarnings,
            }
        }

        return {
            success: true,
            data: {
                summary,
                days,
            },
            validationWarnings: validationWarnings.length > 0 ? validationWarnings : undefined,
        }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to parse HTML"),
        }
    }
}
