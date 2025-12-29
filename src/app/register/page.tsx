"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LanguageToggle } from "@/features/locale/components/language-toggle"
import { registerUser } from "./actions/register-actions"
import { PASSWORD_MIN_LENGTH } from "./schemas/register-schemas"
import { useRegisterStore } from "./stores/register-store"

export default function RegisterPage() {
    const router = useRouter()
    const locale = useLocale()
    const t = useTranslations("auth.register")
    const tCommon = useTranslations("common")

    const formData = useRegisterStore((state) => state.formData)
    const error = useRegisterStore((state) => state.error)
    const isLoading = useRegisterStore((state) => state.isLoading)
    const success = useRegisterStore((state) => state.success)
    const setFormData = useRegisterStore((state) => state.setFormData)
    const setError = useRegisterStore((state) => state.setError)
    const setLoading = useRegisterStore((state) => state.setLoading)
    const setSuccess = useRegisterStore((state) => state.setSuccess)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const result = await registerUser({ ...formData, locale })

            if (result.error) {
                setError(result.error)
                setLoading(false)
                return
            }

            setSuccess(true)
        } catch {
            setError(t("registrationFailed"))
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="absolute top-4 right-4">
                    <LanguageToggle />
                </div>
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>{t("checkYourEmail")}</CardTitle>
                        <CardDescription>{t("verificationEmailSent")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert>
                            <AlertDescription>{t("verificationInstructions")}</AlertDescription>
                        </Alert>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push("/login")}
                        >
                            {t("backToLogin")}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <LanguageToggle />
            </div>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{t("createAccount")}</CardTitle>
                    <CardDescription>{t("createAccountDescription")}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">{tCommon("fields.name")}</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ name: e.target.value })}
                                required
                                disabled={isLoading}
                                autoComplete="name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">{tCommon("fields.email")}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ email: e.target.value })}
                                required
                                disabled={isLoading}
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">{tCommon("fields.password")}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ password: e.target.value })}
                                required
                                minLength={PASSWORD_MIN_LENGTH}
                                disabled={isLoading}
                                autoComplete="new-password"
                            />
                            <p className="text-sm text-muted-foreground">
                                {t("passwordRequirement", { minLength: PASSWORD_MIN_LENGTH })}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                    setFormData({
                                        confirmPassword: e.target.value,
                                    })
                                }
                                required
                                minLength={PASSWORD_MIN_LENGTH}
                                disabled={isLoading}
                                autoComplete="new-password"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? t("creatingAccount") : t("createAccount")}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            {t("alreadyHaveAccount")}{" "}
                            <Link
                                href="/login"
                                className="text-primary hover:underline font-medium"
                            >
                                {t("signIn")}
                            </Link>
                        </p>
                    </CardContent>
                </form>
            </Card>
        </div>
    )
}
