import { z } from "zod"

export const VerifyEmailSchema = z.object({
    token: z.string().min(1, "Verification token is required"),
})

export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>
