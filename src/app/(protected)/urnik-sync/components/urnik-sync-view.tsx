"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface User {
    id: string
    name: string | null
    email: string
    role: string
    isDemo: boolean
    urnikUsername: string | null
    lastUrnikTestAt: Date | null
}

interface UrnikSyncViewProps {
    user: User
    translations: {
        pageTitle: string
        noCredentials: string
        goToProfile: string
        connectionStatus: string
        connected: string
        notConnected: string
        lastTested: string
    }
    loginResult: { success: boolean; error?: string } | null
}

export function UrnikSyncView({ user, translations: t, loginResult }: UrnikSyncViewProps) {
    const hasCredentials = !!user.urnikUsername
    const isConnected = !!user.lastUrnikTestAt
    const lastTestedText = user.lastUrnikTestAt
        ? new Date(user.lastUrnikTestAt).toLocaleString()
        : null

    if (!hasCredentials) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t.noCredentials}</CardTitle>
                        <CardDescription>
                            Please configure your urnik.net credentials in your profile to use this
                            feature.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/profile">{t.goToProfile}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-muted-foreground">{t.connectionStatus}:</span>
                <Badge variant={isConnected ? "default" : "destructive"}>
                    {isConnected ? t.connected : t.notConnected}
                </Badge>
            </div>

            {lastTestedText && (
                <p className="text-sm text-muted-foreground">
                    {t.lastTested}: {lastTestedText}
                </p>
            )}

            {loginResult && (
                <Card>
                    <CardHeader>
                        <CardTitle>Login Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loginResult.success ? (
                            <div className="text-green-600">
                                ✓ Successfully logged in to urnik.net
                            </div>
                        ) : (
                            <div className="text-red-600">✗ Login failed: {loginResult.error}</div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>
                        Sync functionality will be implemented in the next phase.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
}
