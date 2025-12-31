import type { HourType } from "@/../../prisma/generated/client"
import type { HourEntryDisplay } from "../schemas/hour-entry-schemas"
import { formatDateKey } from "./date-helpers"

export function buildManualEntriesMap(
    manualEntries: Array<{
        id: string
        userId: string
        date: Date
        hours: number
        type: HourType
        taskId: string | null
        description: string | null
        createdAt: Date
        updatedAt: Date
    }>
): Map<
    string,
    {
        id: string
        userId: string
        date: Date
        hours: number
        type: HourType
        taskId: string | null
        description: string | null
        createdAt: Date
        updatedAt: Date
    }
> {
    const map = new Map()
    for (const entry of manualEntries) {
        const key = `${formatDateKey(entry.date)}-${entry.type}`
        map.set(key, {
            id: entry.id,
            userId: entry.userId,
            date: entry.date,
            hours: entry.hours,
            type: entry.type,
            taskId: entry.taskId,
            description: entry.description,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
        })
    }
    return map
}

export function buildGrandTotalEntries(
    summaries: Array<{
        date: Date
        type: HourType
        totalHours: number
        createdAt: Date
        updatedAt: Date
    }>,
    userId: string
): Array<HourEntryDisplay> {
    const grandTotalsMap = new Map<string, { date: Date; hours: number }>()
    for (const summary of summaries) {
        const dateKey = formatDateKey(summary.date)
        const existing = grandTotalsMap.get(dateKey)
        if (existing) {
            existing.hours += summary.totalHours
        } else {
            grandTotalsMap.set(dateKey, {
                date: summary.date,
                hours: summary.totalHours,
            })
        }
    }

    return Array.from(grandTotalsMap.entries())
        .filter(([, data]) => data.hours > 0)
        .map(([dateKey, data]) => ({
            id: `grand-total-${dateKey}`,
            userId,
            date: data.date,
            hours: data.hours,
            type: "WORK" as const,
            description: null,
            taskId: "grand_total",
            createdAt: new Date(),
            updatedAt: new Date(),
        }))
}

export function mergeEntriesWithPendingChanges(
    entries: HourEntryDisplay[],
    pendingChanges: Map<string, { hours: number; action: string; date: string; type: HourType }>,
    userId: string
): HourEntryDisplay[] {
    const displayEntries = entries.map((entry) => {
        const cellKey = `${formatDateKey(entry.date)}-${entry.type}`
        const pendingChange = pendingChanges.get(cellKey)

        if (pendingChange && entry.taskId === null) {
            return {
                ...entry,
                hours: pendingChange.hours,
            }
        }

        return entry
    })

    Array.from(pendingChanges.values()).forEach((change) => {
        if (change.action === "create") {
            const entryExists = displayEntries.some(
                (e) =>
                    formatDateKey(e.date) === change.date &&
                    e.type === change.type &&
                    e.taskId === null
            )

            if (!entryExists) {
                displayEntries.push({
                    id: `pending-${change.date}-${change.type}`,
                    userId,
                    date: new Date(change.date),
                    hours: change.hours,
                    type: change.type,
                    description: null,
                    taskId: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
            }
        }
    })

    return displayEntries
}
