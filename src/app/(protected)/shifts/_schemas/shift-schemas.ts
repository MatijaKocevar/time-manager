import { z } from "zod"
import { SHIFT_LOCATION } from "../_constants"

export const ShiftLocationSchema = z.enum([
    SHIFT_LOCATION.OFFICE,
    SHIFT_LOCATION.HOME,
    SHIFT_LOCATION.VACATION,
    SHIFT_LOCATION.SICK_LEAVE,
])

export type ShiftLocation = z.infer<typeof ShiftLocationSchema>

export const GetShiftsForPeriodSchema = z.object({
    startDate: z.date(),
    endDate: z.date(),
})

export type GetShiftsForPeriodInput = z.infer<typeof GetShiftsForPeriodSchema>

export const UserWithWorkHoursSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().email(),
    workStartTime: z.string().nullable(),
    workEndTime: z.string().nullable(),
    workHoursPerDay: z.number().nullable(),
})

export type UserWithWorkHours = z.infer<typeof UserWithWorkHoursSchema>

export const ShiftSchema = z.object({
    id: z.string(),
    userId: z.string(),
    date: z.date(),
    location: ShiftLocationSchema,
    notes: z.string().nullable(),
    startDateTime: z.date().nullable(),
    endDateTime: z.date().nullable(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
})

export type Shift = z.infer<typeof ShiftSchema>

export const ShiftWithUserSchema = ShiftSchema.extend({
    user: UserWithWorkHoursSchema,
})

export type ShiftWithUser = z.infer<typeof ShiftWithUserSchema>

export const ShiftDisplaySchema = ShiftWithUserSchema.extend({
    dateString: z.string(),
})

export type ShiftDisplay = z.infer<typeof ShiftDisplaySchema>
