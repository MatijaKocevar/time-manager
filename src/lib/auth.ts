import NextAuth, { DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { UserCredentialsSchema } from "@/types"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
        } & DefaultSession["user"]
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

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
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
        jwt: ({ token, user }) => {
            if (user) {
                token.id = user.id
            }
            return token
        },
        session: ({ session, token }) => {
            if (token?.id) {
                session.user.id = token.id as string
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
}
