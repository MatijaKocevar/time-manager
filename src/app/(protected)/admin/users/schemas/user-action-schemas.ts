import { z } from "zod"
import { PASSWORD_MIN_LENGTH } from "../constants/user-constants"

export const UserRoleSchema = z.enum(["USER", "ADMIN"])

export const UserSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().email(),
    emailVerified: z.date().nullable(),
    image: z.string().nullable(),
    password: z.string().nullable(),
    role: UserRoleSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
})

export const UserPublicProfileSchema = UserSchema.pick({
    id: true,
    name: true,
    email: true,
    role: true,
})

export const CreateUserSchema = z.object({
    name: z.string().nullable().optional(),
    email: z.string().email(),
    password: z
        .string()
        .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
    image: z.string().nullable().optional(),
    role: UserRoleSchema.optional(),
})

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
    newPassword: z
        .string()
        .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
})

export type UserRole = z.infer<typeof UserRoleSchema>
export type User = z.infer<typeof UserSchema>
export type UserPublicProfile = z.infer<typeof UserPublicProfileSchema>
export type CreateUser = z.infer<typeof CreateUserSchema>
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type DeleteUserInput = z.infer<typeof DeleteUserSchema>
export type ChangeUserPasswordInput = z.infer<typeof ChangeUserPasswordSchema>
