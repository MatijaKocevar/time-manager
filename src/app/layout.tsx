import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { cookies } from "next/headers"
import "./globals.css"
import SessionWrapper from "@/components/SessionWrapper"
import { QueryProvider } from "@/providers/QueryProvider"
import { ConditionalSidebar } from "@/components/ConditionalSidebar"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "Time Management App",
    description: "Manage your time and tasks efficiently",
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const cookieStore = await cookies()
    const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <QueryProvider>
                    <SessionWrapper>
                        <ConditionalSidebar defaultOpen={defaultOpen}>
                            {children}
                        </ConditionalSidebar>
                    </SessionWrapper>
                </QueryProvider>
            </body>
        </html>
    )
}
