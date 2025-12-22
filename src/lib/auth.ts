import type { DefaultSession, User, Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { UserCredentialsSchema } from "@/types/auth-schema"
import { UserRole } from "@/types"
import { cookies } from "next/headers"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: UserRole
        } & DefaultSession["user"]
    }
    interface User {
        role: UserRole
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: UserRole
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
                        return null
                    }

                    const isPasswordValid = await bcrypt.compare(password, user.password)

                    if (!isPasswordValid) {
                        return null
                    }

                    if (!user.emailVerified) {
                        throw new Error("Please verify your email before logging in")
                    }

                    const cookieStore = await cookies()
                    cookieStore.set("NEXT_LOCALE", user.locale || "en", {
                        path: "/",
                        maxAge: 31536000,
                        sameSite: "lax",
                    })

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        role: user.role,
                    }
                } catch {
                    return null
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
            return session
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
}
