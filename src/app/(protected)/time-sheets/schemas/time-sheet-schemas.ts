import { z } from "zod"

export const GetTimeSheetEntriesSchema = z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
})

export type GetTimeSheetEntriesInput = z.infer<typeof GetTimeSheetEntriesSchema>

export const TimeEntryTaskSchema = z.object({
    title: z.string(),
    status: z.string(),
    list: z
        .object({
            name: z.string(),
            color: z.string().nullable(),
            icon: z.string().nullable(),
        })
        .nullable(),
})

export const TimeEntryDisplaySchema = z.object({
    id: z.string(),
    taskId: z.string(),
    userId: z.string(),
    startTime: z.date(),
    endTime: z.date().nullable(),
    duration: z.number().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    task: TimeEntryTaskSchema,
})

export type TimeEntryDisplay = z.infer<typeof TimeEntryDisplaySchema>
