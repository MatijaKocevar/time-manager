import { z } from "zod"

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

export const CreateUserSchema = z.object({
    name: z.string().nullable().optional(),
    email: z.string().email(),
    password: z.string().min(6),
    image: z.string().nullable().optional(),
    role: UserRoleSchema.optional(),
})

export const UserCredentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export const AuthUserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().nullable(),
    image: z.string().nullable(),
    role: UserRoleSchema,
})

export type UserRole = z.infer<typeof UserRoleSchema>
export type User = z.infer<typeof UserSchema>
export type CreateUser = z.infer<typeof CreateUserSchema>
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UserCredentials = z.infer<typeof UserCredentialsSchema>
export type AuthUser = z.infer<typeof AuthUserSchema>
