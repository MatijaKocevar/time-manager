import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { getServerSession } from "next-auth"
import { getTranslations } from "next-intl/server"
import "./globals.css"
import SessionWrapper from "@/providers/SessionWrapper"
import { QueryProvider } from "@/providers/QueryProvider"
import { ConditionalSidebar } from "@/features/sidebar"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLists } from "./(protected)/tasks/actions/list-actions"
import { NextIntlClientProvider } from "next-intl"
import { ThemeProvider } from "@/providers/theme-provider"

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
    description: "Manage your time, tasks, and hours efficiently",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "TimeManager",
    },
    formatDetection: {
        telephone: false,
    },
}

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: false,
    viewportFit: "contain",
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const session = await getServerSession(authConfig)
    const lists = session ? await getLists().catch(() => []) : []

    let defaultOpen = true
    let userTheme = "light"
    let sidebarExpandedItems: string[] = []
    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { sidebarOpen: true, theme: true, sidebarExpandedItems: true },
        })
        defaultOpen = user?.sidebarOpen ?? true
        userTheme = user?.theme ?? "light"
        sidebarExpandedItems = Array.isArray(user?.sidebarExpandedItems)
            ? (user.sidebarExpandedItems as string[])
            : []
    }

    const themeColor = userTheme === "dark" ? "#000000" : "#ffffff"

    // Fetch breadcrumb translations server-side
    const t = await getTranslations("navigation")
    const breadcrumbTranslations = {
        "/tracker": t("timeTracker"),
        "/tasks": t("tasks"),
        "/hours": t("hours"),
        "/shifts": t("shifts"),
        "/requests": t("requests"),
        "/admin": t("admin"),
        "/admin/users": t("userManagement"),
        "/admin/pending-requests": t("pendingRequests"),
        "/admin/request-history": t("requestHistory"),
        "/admin/holidays": t("holidays"),
        "/profile": t("profile"),
    }
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta
                    name="theme-color"
                    content={themeColor}
                    media="(prefers-color-scheme: dark)"
                />
                <meta
                    name="theme-color"
                    content={themeColor}
                    media="(prefers-color-scheme: light)"
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                const serverTheme = '${userTheme}';
                                if (serverTheme === 'dark') {
                                    document.documentElement.classList.add('dark');
                                }
                            })();
                        `,
                    }}
                />
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col`}
            >
                <NextIntlClientProvider>
                    <ThemeProvider initialTheme={userTheme as "light" | "dark"}>
                        <QueryProvider>
                            <SessionWrapper>
                                <ConditionalSidebar
                                    defaultOpen={defaultOpen}
                                    sidebarExpandedItems={sidebarExpandedItems}
                                    hasSession={!!session}
                                    userRole={session?.user?.role}
                                    userName={session?.user?.name}
                                    userEmail={session?.user?.email}
                                    lists={lists}
                                    breadcrumbTranslations={breadcrumbTranslations}
                                >
                                    {children}
                                </ConditionalSidebar>
                            </SessionWrapper>
                        </QueryProvider>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
