import { z } from "zod"

export const ProfileFormStateSchema = z.object({
    name: z.string(),
    currentPassword: z.string(),
    newPassword: z.string(),
})

export type ProfileFormState = z.infer<typeof ProfileFormStateSchema>
