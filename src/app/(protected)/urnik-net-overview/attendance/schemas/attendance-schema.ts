import { z } from "zod"

export const UserStatusSchema = z.object({
    name: z.string(),
    status: z.enum(["Present", "Absent", "Unreachable"]),
    colorClass: z.string(),
    imageUrl: z.string().nullable(),
})

export const TeamStatusSchema = z.object({
    present: z.array(UserStatusSchema),
    absent: z.array(UserStatusSchema),
})

export type UserStatus = z.infer<typeof UserStatusSchema>
export type TeamStatus = z.infer<typeof TeamStatusSchema>

export interface ParsedAttendanceResult {
    success: boolean
    data?: TeamStatus
    error?: string
    structureValid: boolean
}
