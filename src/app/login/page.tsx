"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LanguageToggle } from "@/components/language-toggle"
import { useTranslations } from "next-intl"

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { status } = useSession()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const t = useTranslations("auth")
    const tCommon = useTranslations("common")

    useEffect(() => {
        const errorParam = searchParams.get("error")
        if (errorParam) {
            setError(t("loginFailed"))
        }
    }, [searchParams, t])

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/")
        }
    }, [status, router])

    if (status === "loading" || status === "authenticated") {
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError(result.error || t("loginFailed"))
                setIsLoading(false)
            } else if (result?.ok) {
                router.push("/")
                router.refresh()
            }
        } catch {
            setError(tCommon("messages.somethingWentWrong"))
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="absolute top-4 right-4">
                <LanguageToggle />
            </div>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{t("signIn")}</CardTitle>
                    <CardDescription>{t("signInDescription")}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">{tCommon("fields.email")}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={tCommon("placeholders.enterEmail")}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{tCommon("fields.password")}</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={tCommon("placeholders.enterPassword")}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                minLength={6}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? tCommon("status.signingIn") : tCommon("actions.signIn")}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            {t("dontHaveAccount")}{" "}
                            <Link
                                href="/register"
                                className="text-primary hover:underline font-medium"
                            >
                                {t("createAccount")}
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
