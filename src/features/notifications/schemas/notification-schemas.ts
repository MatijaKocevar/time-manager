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
    emailAutoCheckin: z.boolean().optional(),
    pushAutoCheckin: z.boolean().optional(),
    emailAutoCheckout: z.boolean().optional(),
    pushAutoCheckout: z.boolean().optional(),
    emailTapIn: z.boolean().optional(),
    pushTapIn: z.boolean().optional(),
    emailTapOut: z.boolean().optional(),
    pushTapOut: z.boolean().optional(),
})

export type UpdateNotificationPreferencesInput = z.infer<typeof UpdateNotificationPreferencesSchema>
