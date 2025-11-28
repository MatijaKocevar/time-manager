import { z } from "zod"
import { Session, User } from "next-auth"
import { JWT } from "next-auth/jwt"

export const ExtendedSessionSchema = z.object({
    user: z.object({
        id: z.string(),
        name: z.string().nullable(),
        email: z.string().nullable(),
        image: z.string().nullable(),
    }),
    expires: z.string(),
})

export const ExtendedUserSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    image: z.string().nullable(),
})

export const ExtendedTokenSchema = z.object({
    id: z.string().optional(),
})

export const ExtendedAuthSessionSchema = z.object({
    user: z.object({
        id: z.string(),
        name: z.string().nullable(),
        email: z.string().nullable(),
        image: z.string().nullable(),
    }),
    expires: z.string(),
})

export type ExtendedSession = z.infer<typeof ExtendedSessionSchema>
export type ExtendedUser = User & z.infer<typeof ExtendedUserSchema>
export type ExtendedToken = JWT & z.infer<typeof ExtendedTokenSchema>
export type ExtendedAuthSession = Session & z.infer<typeof ExtendedAuthSessionSchema>
