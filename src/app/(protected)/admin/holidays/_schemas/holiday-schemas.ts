import { z } from "zod"

const holidayDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")

export const CreateHolidaySchema = z.object({
    date: holidayDate,
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    description: z.string().max(500, "Description must be less than 500 characters").optional(),
    isRecurring: z.boolean().default(false),
})

export const UpdateHolidaySchema = z.object({
    id: z.string(),
    date: holidayDate,
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    description: z.string().max(500, "Description must be less than 500 characters").optional(),
    isRecurring: z.boolean().default(false),
})

export const DeleteHolidaySchema = z.object({
    id: z.string(),
})

export type CreateHolidayInput = z.infer<typeof CreateHolidaySchema>
export type UpdateHolidayInput = z.infer<typeof UpdateHolidaySchema>
export type DeleteHolidayInput = z.infer<typeof DeleteHolidaySchema>
