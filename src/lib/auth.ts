import type { DefaultSession, User, Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { UserCredentialsSchema } from "@/types/auth-schema"
import { UserRole } from "@/types"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: UserRole
            locale: string
        } & DefaultSession["user"]
    }
    interface User {
        role: UserRole
        locale: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: UserRole
        locale: string
    }
}

export const authConfig = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    const { email, password } = UserCredentialsSchema.parse(credentials)

                    const user = await prisma.user.findUnique({
                        where: { email },
                    })

                    if (!user || !user.password) {
                        throw new Error("Invalid email or password")
                    }

                    const isPasswordValid = await bcrypt.compare(password, user.password)

                    if (!isPasswordValid) {
                        throw new Error("Invalid email or password")
                    }

                    if (!user.emailVerified) {
                        throw new Error(
                            "Please verify your email before logging in. Check your inbox for the verification link."
                        )
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        role: user.role,
                        locale: user.locale || "en",
                    }
                } catch (error) {
                    if (error instanceof Error) {
                        throw error
                    }
                    throw new Error("Authentication failed")
                }
            },
        }),
    ],
    session: {
        strategy: "jwt" as const,
    },
    callbacks: {
        jwt: ({ token, user }: { token: JWT; user: User | undefined }) => {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.locale = user.locale || "en"
            }
            return token
        },
        session: ({ session, token }: { session: Session; token: JWT }) => {
            if (token?.id) {
                session.user.id = token.id
            }
            if (token?.role) {
                session.user.role = token.role
            }
            if (token?.locale) {
                session.user.locale = token.locale
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
}
