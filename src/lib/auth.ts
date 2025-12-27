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
                console.log("Authorize called with email:", credentials?.email)

                try {
                    const { email, password } = UserCredentialsSchema.parse(credentials)
                    console.log("Credentials validated")

                    const user = await prisma.user.findUnique({
                        where: { email },
                    })

                    console.log("User found:", user ? `${user.email} (ID: ${user.id})` : "null")

                    if (!user || !user.password) {
                        console.log("No user or no password")
                        throw new Error("Invalid email or password")
                    }

                    const isPasswordValid = await bcrypt.compare(password, user.password)
                    console.log("Password valid:", isPasswordValid)

                    if (!isPasswordValid) {
                        console.log("Invalid password")
                        throw new Error("Invalid email or password")
                    }

                    console.log("Email verified:", user.emailVerified ? "Yes" : "No")

                    if (!user.emailVerified) {
                        console.log("Email not verified")
                        throw new Error(
                            "Please verify your email before logging in. Check your inbox for the verification link."
                        )
                    }

                    console.log("Authorization successful, returning user data")
                    console.log("   - ID:", user.id)
                    console.log("   - Email:", user.email)
                    console.log("   - Role:", user.role)
                    console.log("   - Locale:", user.locale || "en")

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        role: user.role,
                        locale: user.locale || "en",
                    }
                } catch (error) {
                    console.log("Error in authorize:", error)
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
    },
    secret: process.env.NEXTAUTH_SECRET,
}
