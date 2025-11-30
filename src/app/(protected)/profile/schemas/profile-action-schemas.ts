import { z } from "zod"

export const UpdateProfileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
