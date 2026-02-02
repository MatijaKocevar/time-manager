"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    updateUrnikCredentials,
    testUrnikConnection,
    clearUrnikCredentials,
} from "../actions/profile-actions"

interface UrnikCredentialsFormProps {
    initialUsername?: string | null
    hasCredentials: boolean
    lastTestAt?: Date | null
    isDemo: boolean
    translations: {
        title: string
        description: string
        username: string
        password: string
        usernamePlaceholder: string
        passwordPlaceholder: string
        saveCredentials: string
        testConnection: string
        clearCredentials: string
        updateSuccess: string
        testSuccess: string
        clearSuccess: string
        lastTested: string
        notTested: string
        testing: string
        saving: string
    }
}

export function UrnikCredentialsForm({
    initialUsername,
    hasCredentials,
    lastTestAt,
    isDemo,
    translations: t,
}: UrnikCredentialsFormProps) {
    const [username, setUsername] = useState(initialUsername || "")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess("")
        setIsLoading(true)

        try {
            const result = await updateUrnikCredentials({ username, password })

            if (result.error) {
                setError(result.error)
            } else {
                setSuccess(t.updateSuccess)
                setPassword("")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleTest = async () => {
        setError("")
        setSuccess("")
        setIsTesting(true)

        try {
            const result = await testUrnikConnection()

            if (result.error) {
                setError(result.error)
            } else {
                setSuccess(t.testSuccess)
            }
        } finally {
            setIsTesting(false)
        }
    }

    const handleClear = async () => {
        if (!confirm("Are you sure you want to clear your urnik.net credentials?")) {
            return
        }

        setError("")
        setSuccess("")
        setIsLoading(true)

        try {
            const result = await clearUrnikCredentials()

            if (result.error) {
                setError(result.error)
            } else {
                setUsername("")
                setPassword("")
                setSuccess(t.clearSuccess)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const lastTestedText = lastTestAt
        ? `${t.lastTested}: ${new Date(lastTestAt).toLocaleString()}`
        : t.notTested

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                    )}
                    {success && (
                        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                            {success}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="urnik-username">{t.username}</Label>
                        <Input
                            id="urnik-username"
                            type="text"
                            placeholder={t.usernamePlaceholder}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading || isTesting || isDemo}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="urnik-password">{t.password}</Label>
                        <div className="relative">
                            <Input
                                id="urnik-password"
                                type={showPassword ? "text" : "password"}
                                placeholder={t.passwordPlaceholder}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading || isTesting || isDemo}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isDemo}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="submit" disabled={isLoading || isTesting || isDemo}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? t.saving : t.saveCredentials}
                        </Button>

                        {hasCredentials && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleTest}
                                    disabled={isLoading || isTesting || isDemo}
                                >
                                    {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isTesting ? t.testing : t.testConnection}
                                </Button>

                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleClear}
                                    disabled={isLoading || isTesting || isDemo}
                                >
                                    {t.clearCredentials}
                                </Button>
                            </>
                        )}
                    </div>

                    {hasCredentials && (
                        <>
                            <Separator />
                            <p className="text-sm text-muted-foreground">{lastTestedText}</p>
                        </>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}
