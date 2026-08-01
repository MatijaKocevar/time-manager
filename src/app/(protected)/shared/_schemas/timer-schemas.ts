import { z } from "zod"
import type { HourType } from "@/../../prisma/generated/client"

export const StartTimerSchema = z.object({
    taskId: z.string().optional(),
    type: z
        .enum(["WORK", "WORK_FROM_HOME", "BREAK", "PRIVATE", "VACATION", "SICK_LEAVE"])
        .optional(),
})

export const StopTimerSchema = z.object({
    id: z.string(),
})

export type StartTimerInput = z.infer<typeof StartTimerSchema>
export type StopTimerInput = z.infer<typeof StopTimerSchema>

export interface TimerDisplay {
    id: string
    taskId: string
    userId: string
    startTime: Date
    endTime: Date | null
    duration: number | null
    createdAt: Date
    updatedAt: Date
    type: HourType
    task: {
        id: string
        title: string
        isSystemTask: boolean
    }
}
