import { z } from "zod"

export const ProfileFormStateSchema = z.object({
    name: z.string(),
    currentPassword: z.string(),
    newPassword: z.string(),
    workStartTime: z.string(),
    workEndTime: z.string(),
})

export type ProfileFormState = z.infer<typeof ProfileFormStateSchema>
