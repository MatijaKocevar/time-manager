import { z } from "zod"

export const UpdateNotificationPreferencesSchema = z.object({
    emailNewRequest: z.boolean().optional(),
    emailRequestApproved: z.boolean().optional(),
    emailRequestRejected: z.boolean().optional(),
    emailRequestCancelled: z.boolean().optional(),
    pushNewRequest: z.boolean().optional(),
    pushRequestApproved: z.boolean().optional(),
    pushRequestRejected: z.boolean().optional(),
    pushRequestCancelled: z.boolean().optional(),
})

export type UpdateNotificationPreferencesInput = z.infer<typeof UpdateNotificationPreferencesSchema>
