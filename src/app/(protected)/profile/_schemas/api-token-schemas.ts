import { z } from "zod"

export const ApiTokenDisplaySchema = z.object({
    id: z.string(),
    name: z.string(),
    lastUsedAt: z.date().nullable(),
    expiresAt: z.date().nullable(),
    createdAt: z.date(),
})

export type ApiTokenDisplay = z.infer<typeof ApiTokenDisplaySchema>

export const CreateApiTokenSchema = z.object({
    name: z.string().min(1).max(100),
    expiresInDays: z.number().int().min(1).max(3650).nullable().optional(),
})

export type CreateApiTokenInput = z.infer<typeof CreateApiTokenSchema>

export const RevokeApiTokenSchema = z.object({
    id: z.string(),
})

export type RevokeApiTokenInput = z.infer<typeof RevokeApiTokenSchema>
