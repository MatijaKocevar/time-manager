import { z } from "zod"
import { SHIFT_LOCATION } from "../constants"

export const ShiftLocationSchema = z.enum([
    SHIFT_LOCATION.OFFICE,
    SHIFT_LOCATION.HOME,
    SHIFT_LOCATION.VACATION,
    SHIFT_LOCATION.SICK_LEAVE,
    SHIFT_LOCATION.OTHER,
])

export type ShiftLocation = z.infer<typeof ShiftLocationSchema>

export const UpdateShiftSchema = z.object({
    date: z.date(),
    location: ShiftLocationSchema,
    notes: z.string().optional(),
})

export const UpdateUserShiftSchema = z.object({
    userId: z.string(),
    date: z.date(),
    location: ShiftLocationSchema,
    notes: z.string().optional(),
})

export const GetShiftsForPeriodSchema = z.object({
    startDate: z.date(),
    endDate: z.date(),
})

export type UpdateShiftInput = z.infer<typeof UpdateShiftSchema>
export type UpdateUserShiftInput = z.infer<typeof UpdateUserShiftSchema>
export type GetShiftsForPeriodInput = z.infer<typeof GetShiftsForPeriodSchema>
