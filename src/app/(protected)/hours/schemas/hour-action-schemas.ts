import { z } from "zod"

export const HourTypeSchema = z.enum(["WORK", "VACATION", "SICK_LEAVE", "WORK_FROM_HOME", "OTHER"])

const CreateHourEntryInputSchema = z.object({
    date: z.string(),
    hours: z.number().max(24, "Hours cannot exceed 24"),
    type: HourTypeSchema,
    description: z.string().optional(),
})

export const CreateHourEntrySchema = CreateHourEntryInputSchema.transform((data) => ({
    ...data,
    date: new Date(data.date),
}))

const UpdateHourEntryInputSchema = z.object({
    id: z.string(),
    date: z.string(),
    hours: z.number().max(24, "Hours cannot exceed 24"),
    type: HourTypeSchema,
    description: z.string().optional(),
})

export const UpdateHourEntrySchema = UpdateHourEntryInputSchema.transform((data) => ({
    ...data,
    date: new Date(data.date),
}))

export const DeleteHourEntrySchema = z.object({
    id: z.string(),
})

const BulkCreateHourEntriesInputSchema = z.object({
    startDate: z.string(),
    endDate: z.string(),
    hours: z.number().max(24),
    type: HourTypeSchema,
    description: z.string().optional(),
    skipWeekends: z.boolean().default(true),
})

export const BulkCreateHourEntriesSchema = BulkCreateHourEntriesInputSchema.transform((data) => ({
    ...data,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
}))

export type HourType = z.infer<typeof HourTypeSchema>
export type CreateHourEntryInput = z.input<typeof CreateHourEntrySchema>
export type UpdateHourEntryInput = z.input<typeof UpdateHourEntrySchema>
export type DeleteHourEntryInput = z.infer<typeof DeleteHourEntrySchema>
export type BulkCreateHourEntriesInput = z.input<typeof BulkCreateHourEntriesSchema>
