import { z } from "zod"
import { HourTypeSchema } from "./hour-action-schemas"

export const VIEW_MODE_VALUES = {
    DAILY: "DAILY",
    WEEKLY: "WEEKLY",
    MONTHLY: "MONTHLY",
    YEARLY: "YEARLY",
} as const

export const HourFilterSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: HourTypeSchema.optional(),
})

export const ViewModeSchema = z.enum([
    VIEW_MODE_VALUES.DAILY,
    VIEW_MODE_VALUES.WEEKLY,
    VIEW_MODE_VALUES.MONTHLY,
    VIEW_MODE_VALUES.YEARLY,
])

export type HourFilter = z.infer<typeof HourFilterSchema>
export type ViewMode = z.infer<typeof ViewModeSchema>
