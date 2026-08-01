import { z } from "zod"
import { UserRoleSchema } from "./user-action-schemas"

export const UserTableItemSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    role: UserRoleSchema,
    isActive: z.boolean(),
    deactivatedAt: z.date().nullable(),
    anonymizedAt: z.date().nullable(),
    createdAt: z.date(),
})

export type UserTableItem = z.infer<typeof UserTableItemSchema>
