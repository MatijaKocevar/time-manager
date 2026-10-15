import { z } from "zod"

export const URNIK_ABSENCE_BADGE = {
    OFFICE: "OFFICE",
    HOME: "HOME",
    VACATION: "VACATION",
    SICK_LEAVE: "SICK_LEAVE",
    OVERTIME_USE: "OVERTIME_USE",
    BREAK: "BREAK",
    ABSENCE: "ABSENCE",
} as const

export const UrnikAbsenceBadgeSchema = z.enum([
    URNIK_ABSENCE_BADGE.OFFICE,
    URNIK_ABSENCE_BADGE.HOME,
    URNIK_ABSENCE_BADGE.VACATION,
    URNIK_ABSENCE_BADGE.SICK_LEAVE,
    URNIK_ABSENCE_BADGE.OVERTIME_USE,
    URNIK_ABSENCE_BADGE.BREAK,
    URNIK_ABSENCE_BADGE.ABSENCE,
])

export type UrnikAbsenceBadge = z.infer<typeof UrnikAbsenceBadgeSchema>

export const UrnikEmployeeSchema = z.object({
    id: z.string(),
    name: z.string(),
})

export type UrnikEmployee = z.infer<typeof UrnikEmployeeSchema>

export const UrnikAbsenceSchema = z.object({
    userId: z.string(),
    dateString: z.string(),
    badge: UrnikAbsenceBadgeSchema,
})

export type UrnikAbsence = z.infer<typeof UrnikAbsenceSchema>

export const GetUrnikAbsencesSchema = z.object({
    startDate: z.date(),
    endDate: z.date(),
})

export type GetUrnikAbsencesInput = z.infer<typeof GetUrnikAbsencesSchema>
