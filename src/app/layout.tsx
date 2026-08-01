import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { getServerSession } from "next-auth"
import { getTranslations } from "next-intl/server"
import { Toaster } from "sonner"
import "./globals.css"
import SessionWrapper from "@/providers/SessionWrapper"
import { QueryProvider } from "@/providers/QueryProvider"
import { ConditionalSidebar } from "@/features/sidebar"
import { AppHeader } from "@/features/sidebar"
import { getUserLayoutData } from "@/features/sidebar/actions/sidebar-actions"
import { authConfig } from "@/lib/auth"
import { getLists } from "./(protected)/tasks/_actions/list-actions"
import { NextIntlClientProvider } from "next-intl"
import { ThemeProvider } from "@/features/theme/providers/theme-provider"
import { NavigationProgress } from "@/features/navigation/components/navigation-progress"
import { BreadcrumbProvider } from "@/features/breadcrumbs"
import { CookieBanner } from "@/features/cookie-consent"

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
    icons: {
        icon: [
            { url: "/favicon.svg", type: "image/svg+xml" },
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Time Manager",
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

    let pendingRequestsCount = 0
    if (session?.user?.role === "ADMIN") {
        const { getNotifications } =
            await import("@/features/notifications/actions/notification-actions")
        const notifications = await getNotifications()
        pendingRequestsCount = notifications.count
    }

    const { defaultOpen, userTheme, sidebarExpandedItems, hasUrnikCredentials } =
        await getUserLayoutData()

    const themeColor = userTheme === "dark" ? "#000000" : "#ffffff"

    const t = await getTranslations("navigation")
    const tHeader = await getTranslations("header")
    const tCommon = await getTranslations("common.actions")
    const tCookie = await getTranslations("cookieConsent")
    let cookieConsent: boolean | null = null
    if (session) {
        const { getCookieConsent } =
            await import("@/features/cookie-consent/actions/cookie-consent-actions")
        cookieConsent = await getCookieConsent()
    }
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
    const settingsMenuTranslations = session
        ? {
              settings: tHeader("menu.settings"),
              language: tHeader("menu.language"),
              theme: tHeader("menu.theme"),
              restartTutorial: tHeader("menu.restartTutorial"),
              profile: t("profile"),
              logout: tCommon("logOut"),
          }
        : undefined
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
                                const isAuthenticated = ${!!session};
                                let theme = serverTheme;
                                
                                if (!isAuthenticated) {
                                    try {
                                        const stored = localStorage.getItem('theme-storage');
                                        if (stored) {
                                            const parsed = JSON.parse(stored);
                                            theme = parsed.state?.theme || theme;
                                        } else {
                                            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                                            theme = prefersDark ? 'dark' : 'light';
                                        }
                                    } catch (e) {
                                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                                        theme = prefersDark ? 'dark' : 'light';
                                    }
                                }
                                
                                if (theme === 'dark') {
                                    document.documentElement.classList.add('dark');
                                }
                            })();
                        `,
                    }}
                />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col`}
            >
                <NextIntlClientProvider>
                    <ThemeProvider
                        initialTheme={userTheme as "light" | "dark"}
                        isAuthenticated={!!session}
                    >
                        <NavigationProgress />
                        <QueryProvider>
                            <SessionWrapper>
                                <BreadcrumbProvider initialOverrides={breadcrumbTranslations}>
                                    <ConditionalSidebar
                                        defaultOpen={defaultOpen}
                                        sidebarExpandedItems={sidebarExpandedItems}
                                        hasSession={!!session}
                                        userRole={session?.user?.role}
                                        userName={session?.user?.name}
                                        userEmail={session?.user?.email}
                                        lists={lists}
                                        pendingRequestsCount={pendingRequestsCount}
                                        hasUrnikCredentials={hasUrnikCredentials}
                                        settingsMenuTranslations={settingsMenuTranslations}
                                        header={
                                            session ? (
                                                <AppHeader
                                                    breadcrumbTranslations={breadcrumbTranslations}
                                                />
                                            ) : null
                                        }
                                    >
                                        {children}
                                    </ConditionalSidebar>
                                </BreadcrumbProvider>
                            </SessionWrapper>
                        </QueryProvider>
                        <Toaster />
                        {session && (
                            <CookieBanner
                                initialConsent={cookieConsent}
                                title={tCookie("title")}
                                description={tCookie("description")}
                                acknowledgeLabel={tCookie("acknowledge")}
                            />
                        )}
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
