import { z } from "zod"
import { MIN_PASSWORD_LENGTH } from "../constants/profile-constants"

export const UpdateProfileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    currentPassword: z.string().optional(),
    newPassword: z
        .string()
        .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
        .optional(),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
