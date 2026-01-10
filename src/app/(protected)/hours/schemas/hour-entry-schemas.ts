import { z } from "zod"
import { HourTypeSchema } from "./hour-action-schemas"

export const HourEntryDisplaySchema = z.object({
    id: z.string(),
    userId: z.string(),
    date: z.date(),
    hours: z.number(),
    type: HourTypeSchema,
    description: z.string().nullable(),
    taskId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
})

export type HourEntryDisplay = z.infer<typeof HourEntryDisplaySchema>

export const PendingChangeSchema = z.object({
    cellKey: z.string(),
    entryId: z.string().nullable(),
    date: z.string(),
    type: HourTypeSchema,
    hours: z.number(),
    originalHours: z.number().nullable(),
    action: z.enum(["create", "update", "delete"]),
})

export type PendingChange = z.infer<typeof PendingChangeSchema>
