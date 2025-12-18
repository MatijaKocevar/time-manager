import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { cookies } from "next/headers"
import { getServerSession } from "next-auth"
import { getTranslations } from "next-intl/server"
import "./globals.css"
import SessionWrapper from "@/providers/SessionWrapper"
import { QueryProvider } from "@/providers/QueryProvider"
import { ConditionalSidebar } from "@/features/sidebar"
import { authConfig } from "@/lib/auth"
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
        statusBarStyle: "black-translucent",
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
    userScalable: true,
    viewportFit: "cover",
    themeColor: [
        { media: "(prefers-color-scheme: dark)", color: "#000000" },
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    ],
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const cookieStore = await cookies()
    const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
    const session = await getServerSession(authConfig)
    const lists = session ? await getLists().catch(() => []) : []

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
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    const stored = localStorage.getItem('theme-storage');
                                    let theme = 'system';
                                    
                                    if (stored) {
                                        theme = JSON.parse(stored).state.theme;
                                    }
                                    
                                    const isDark = theme === 'dark' || 
                                        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                                    
                                    if (isDark) {
                                        document.documentElement.classList.add('dark');
                                    } else {
                                        document.documentElement.classList.remove('dark');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col`}
            >
                <NextIntlClientProvider>
                    <ThemeProvider>
                        <QueryProvider>
                            <SessionWrapper>
                                <ConditionalSidebar
                                    defaultOpen={defaultOpen}
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
