"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { updateAutoCheckinPreferences } from "../actions/profile-actions"

interface AutoCheckinPreferencesProps {
    initialEnabled: boolean
    initialCheckoutEnabled: boolean
    isDemo: boolean
}

export function AutoCheckinPreferences({
    initialEnabled,
    initialCheckoutEnabled,
    isDemo,
}: AutoCheckinPreferencesProps) {
    const t = useTranslations("profile.autoCheckin")
    const tCommon = useTranslations("common")

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [autoCheckInEnabled, setAutoCheckInEnabled] = useState(initialEnabled)
    const [autoCheckOutEnabled, setAutoCheckOutEnabled] = useState(initialCheckoutEnabled)

    const handleSave = async () => {
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const result = await updateAutoCheckinPreferences({
                autoCheckInEnabled,
                autoCheckOutEnabled,
            })

            if (result.error) {
                setError(result.error)
            } else {
                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>{t("description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                        {t("updateSuccess")}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="autoCheckInEnabled"
                            checked={autoCheckInEnabled}
                            onChange={(e) => setAutoCheckInEnabled(e.target.checked)}
                            disabled={isDemo}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label
                            htmlFor="autoCheckInEnabled"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {t("enableAutoCheckin")}
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="autoCheckOutEnabled"
                            checked={autoCheckOutEnabled}
                            onChange={(e) => setAutoCheckOutEnabled(e.target.checked)}
                            disabled={isDemo}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label
                            htmlFor="autoCheckOutEnabled"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {t("enableAutoCheckout")}
                        </Label>
                    </div>

                    <div className="pt-2">
                        <p className="text-sm text-muted-foreground">{t("reminderInfo")}</p>
                        <p className="text-sm text-muted-foreground mt-2">{t("autoDetectType")}</p>
                    </div>
                </div>

                <Button onClick={handleSave} disabled={loading || isDemo}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {tCommon("actions.save")}
                </Button>
            </CardContent>
        </Card>
    )
}
