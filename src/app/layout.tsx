import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { cookies } from "next/headers"
import { getServerSession } from "next-auth"
import "./globals.css"
import SessionWrapper from "@/providers/SessionWrapper"
import { QueryProvider } from "@/providers/QueryProvider"
import { ConditionalSidebar } from "@/features/sidebar"
import { authConfig } from "@/lib/auth"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "Time Manager",
    description: "Manage your time and tasks efficiently",
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const cookieStore = await cookies()
    const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
    const session = await getServerSession(authConfig)

    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <QueryProvider>
                    <SessionWrapper>
                        <ConditionalSidebar
                            defaultOpen={defaultOpen}
                            hasSession={!!session}
                            userRole={session?.user?.role}
                            userName={session?.user?.name}
                            userEmail={session?.user?.email}
                        >
                            {children}
                        </ConditionalSidebar>
                    </SessionWrapper>
                </QueryProvider>
            </body>
        </html>
    )
}
