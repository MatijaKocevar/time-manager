import { z } from "zod"

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

export const OffHoursRangeSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    from: z.string().regex(timePattern),
    to: z.string().regex(timePattern),
    includeManual: z.boolean().default(false),
})

export const ReclassifyOffHoursSchema = OffHoursRangeSchema.extend({
    applyToFuture: z.boolean().default(false),
})

export const UndoOffHoursSchema = z.object({
    windowId: z.string(),
})

export type OffHoursRangeInput = z.input<typeof OffHoursRangeSchema>
export type ReclassifyOffHoursInput = z.input<typeof ReclassifyOffHoursSchema>
export type UndoOffHoursInput = z.input<typeof UndoOffHoursSchema>

export interface OffHoursTrackedSegment {
    id: string
    taskId: string
    taskTitle: string
    startTime: Date
    endTime: Date | null
    durationSeconds: number
    type: string
    action: "convert" | "split"
    insideSeconds: number
}

export interface OffHoursManualEntry {
    id: string
    type: string
    hours: number
    description: string | null
}

export interface OffHoursPreview {
    windowStart: Date
    windowEnd: Date
    tracked: OffHoursTrackedSegment[]
    manual: OffHoursManualEntry[]
    totals: {
        trackedWorkSeconds: number
        convertedSeconds: number
    }
    activeTimer: boolean
}

export type OffHoursPreviewResult = { data: OffHoursPreview } | { error: string }

export type OffHoursApplyResult =
    | { data: { updated: number; created: number; hoursMoved: number; windowId: string } }
    | { error: string }
