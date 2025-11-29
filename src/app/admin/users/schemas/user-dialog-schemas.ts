import { z } from "zod"
import { UserRoleSchema } from "@/types"

export const CreateUserStateSchema = z.object({
    name: z.string(),
    email: z.string(),
    password: z.string(),
    role: UserRoleSchema,
})

export const EditUserStateSchema = z.object({
    id: z.string(),
    name: z.string(),
    role: UserRoleSchema,
})

export const ChangePasswordStateSchema = z.object({
    id: z.string(),
    newPassword: z.string(),
})

export const DeleteUserStateSchema = z.object({
    id: z.string(),
    name: z.string(),
})

export type CreateUserState = z.infer<typeof CreateUserStateSchema>
export type EditUserState = z.infer<typeof EditUserStateSchema>
export type ChangePasswordState = z.infer<typeof ChangePasswordStateSchema>
export type DeleteUserState = z.infer<typeof DeleteUserStateSchema>
