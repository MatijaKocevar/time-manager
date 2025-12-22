"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { verifyEmail } from "./actions/verify-actions"

export default function VerifyEmailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const t = useTranslations("auth.verification")
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [error, setError] = useState("")

    useEffect(() => {
        const token = searchParams.get("token")

        async function verify() {
            if (!token) {
                setStatus("error")
                setError(t("invalidToken"))
                return
            }

            const result = await verifyEmail(token)

            if (result.error) {
                setStatus("error")
                setError(result.error)
            } else {
                setStatus("success")
            }
        }

        verify()
    }, [searchParams, router, t])

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>{t("verifying")}</CardTitle>
                        <CardDescription>{t("pleaseWait")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>{t("verificationFailed")}</CardTitle>
                        <CardDescription>{t("errorOccurred")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/register">{t("registerAgain")}</Link>
                            </Button>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/login">{t("backToLogin")}</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{t("emailVerified")}</CardTitle>
                    <CardDescription>{t("successMessage")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertDescription>{t("successConfirmation")}</AlertDescription>
                    </Alert>
                    
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p>{t("loginInstructions")}</p>
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="font-medium text-blue-900 dark:text-blue-100">
                                💡 {t("pwaRecommendation")}
                            </p>
                            <p className="mt-1 text-blue-800 dark:text-blue-200">
                                {t("pwaInstructions")}
                            </p>
                        </div>
                    </div>
                    
                    <Button className="w-full" asChild>
                        <Link href="/login">{t("goToLogin")}</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
