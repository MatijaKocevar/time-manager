import { z } from "zod"

export const UserCredentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export const AuthUserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().nullable(),
    image: z.string().nullable(),
})

export type UserCredentials = z.infer<typeof UserCredentialsSchema>
export type AuthUser = z.infer<typeof AuthUserSchema>
