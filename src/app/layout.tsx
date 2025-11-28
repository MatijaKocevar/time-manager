import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { cookies } from "next/headers"
import "./globals.css"
import SessionWrapper from "@/components/SessionWrapper"
import { QueryProvider } from "@/providers/QueryProvider"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getServerSession } from "next-auth"
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
    title: "Time Management App",
    description: "Manage your time and tasks efficiently",
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const session = await getServerSession(authConfig)
    const cookieStore = await cookies()
    const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <QueryProvider>
                    <SessionWrapper>
                        {session ? (
                            <SidebarProvider defaultOpen={defaultOpen}>
                                <AppSidebar />
                                <main className="flex-1">
                                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                                        <SidebarTrigger className="-ml-1" />
                                    </header>
                                    <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
                                </main>
                            </SidebarProvider>
                        ) : (
                            children
                        )}
                    </SessionWrapper>
                </QueryProvider>
            </body>
        </html>
    )
}
