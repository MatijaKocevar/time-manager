import { z } from "zod"

export const ApiTokenHourTypeSchema = z.enum([
    "WORK",
    "WORK_FROM_HOME",
    "BREAK",
    "PRIVATE",
    "VACATION",
    "SICK_LEAVE",
    "OVERTIME_USE",
    "OFF_HOURS",
])

export const ApiTokenDisplaySchema = z.object({
    id: z.string(),
    name: z.string(),
    defaultHourType: ApiTokenHourTypeSchema.nullable(),
    lastUsedAt: z.date().nullable(),
    expiresAt: z.date().nullable(),
    createdAt: z.date(),
})

export type ApiTokenDisplay = z.infer<typeof ApiTokenDisplaySchema>

export const CreateApiTokenSchema = z.object({
    name: z.string().min(1).max(100),
    expiresInDays: z.number().int().min(1).max(3650).nullable().optional(),
    defaultHourType: ApiTokenHourTypeSchema.nullable().optional(),
})

export type CreateApiTokenInput = z.infer<typeof CreateApiTokenSchema>

export const UpdateApiTokenHourTypeSchema = z.object({
    id: z.string(),
    defaultHourType: ApiTokenHourTypeSchema.nullable(),
})

export type UpdateApiTokenHourTypeInput = z.infer<typeof UpdateApiTokenHourTypeSchema>

export const RevokeApiTokenSchema = z.object({
    id: z.string(),
})

export type RevokeApiTokenInput = z.infer<typeof RevokeApiTokenSchema>
