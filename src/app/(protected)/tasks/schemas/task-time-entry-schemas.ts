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
})

export const StartTimerSchema = z.object({
    taskId: z.string(),
})

export const StopTimerSchema = z.object({
    id: z.string(),
})

export type TaskTimeEntryDisplay = z.infer<typeof TaskTimeEntryDisplaySchema>
export type StartTimerInput = z.infer<typeof StartTimerSchema>
export type StopTimerInput = z.infer<typeof StopTimerSchema>
