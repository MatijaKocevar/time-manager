import { z } from "zod"

export const UpdateManagedUsersSchema = z.object({
    userIds: z.array(z.string()),
})

export const ToggleAutoAdminSchema = z.object({
    enabled: z.boolean(),
})

export type UpdateManagedUsersInput = z.infer<typeof UpdateManagedUsersSchema>
export type ToggleAutoAdminInput = z.infer<typeof ToggleAutoAdminSchema>
