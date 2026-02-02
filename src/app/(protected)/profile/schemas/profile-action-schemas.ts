import { z } from "zod"
import { MIN_PASSWORD_LENGTH } from "../constants/profile-constants"

const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/

export const UpdateProfileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    currentPassword: z.string().optional(),
    newPassword: z
        .string()
        .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
        .optional(),
    workStartTime: z.string().regex(timeRegex, "Time must be in HH:MM format").optional(),
    workEndTime: z.string().regex(timeRegex, "Time must be in HH:MM format").optional(),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>

export const DeactivateAccountSchema = z.object({
    anonymize: z.boolean().default(false),
})

export type DeactivateAccountInput = z.infer<typeof DeactivateAccountSchema>

export const UpdateUrnikCredentialsSchema = z.object({
    username: z.string().min(1, "Username is required").optional(),
    password: z.string().min(1, "Password is required").optional(),
    clearCredentials: z.boolean().optional(),
})

export type UpdateUrnikCredentialsInput = z.infer<typeof UpdateUrnikCredentialsSchema>
