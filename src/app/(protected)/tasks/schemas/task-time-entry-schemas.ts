import { z } from "zod"

export const TaskTimeEntryDisplaySchema = z.object({
    id: z.string(),
    taskId: z.string(),
    userId: z.string(),
    startTime: z.date(),
    endTime: z.date().nullable(),
    duration: z.number().int().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    task: z.object({
        id: z.string(),
        title: z.string(),
        isSystemTask: z.boolean(),
    }),
})

export const ChildTimeAggregationSchema = z.object({
    isAggregation: z.literal(true),
    aggregatedDuration: z.number().int(),
})

export const TaskTimeEntryWithAggregationSchema = z.discriminatedUnion("isAggregation", [
    TaskTimeEntryDisplaySchema.extend({ isAggregation: z.literal(false).optional() }),
    ChildTimeAggregationSchema,
])

export const StartTimerSchema = z.object({
    taskId: z.string(),
})

export const StopTimerSchema = z.object({
    id: z.string(),
})

export const UpdateTaskTimeEntrySchema = z.object({
    id: z.string(),
    startTime: z.date(),
    endTime: z.date().nullable().optional(),
})

export const DeleteTaskTimeEntrySchema = z.object({
    id: z.string(),
})

export const CreateTaskTimeEntrySchema = z.object({
    taskId: z.string(),
    startTime: z.date(),
    endTime: z.date(),
})

export type TaskTimeEntryDisplay = z.infer<typeof TaskTimeEntryDisplaySchema>
export type ChildTimeAggregation = z.infer<typeof ChildTimeAggregationSchema>
export type TaskTimeEntryWithAggregation = z.infer<typeof TaskTimeEntryWithAggregationSchema>
export type StartTimerInput = z.infer<typeof StartTimerSchema>
export type StopTimerInput = z.infer<typeof StopTimerSchema>
export type UpdateTaskTimeEntryInput = z.infer<typeof UpdateTaskTimeEntrySchema>
export type DeleteTaskTimeEntryInput = z.infer<typeof DeleteTaskTimeEntrySchema>
export type CreateTaskTimeEntryInput = z.infer<typeof CreateTaskTimeEntrySchema>
