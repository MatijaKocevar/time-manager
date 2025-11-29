import { z } from "zod"
import { UserRoleSchema } from "@/types"

export const UpdateUserSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Name is required"),
    role: UserRoleSchema,
})

export const DeleteUserSchema = z.object({
    id: z.string(),
})

export const ChangeUserPasswordSchema = z.object({
    id: z.string(),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
})

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type DeleteUserInput = z.infer<typeof DeleteUserSchema>
export type ChangeUserPasswordInput = z.infer<typeof ChangeUserPasswordSchema>
