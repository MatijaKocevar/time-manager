"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
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
    const [autoCheckInEnabled, setAutoCheckInEnabled] = useState(initialEnabled)
    const [autoCheckOutEnabled, setAutoCheckOutEnabled] = useState(initialCheckoutEnabled)

    const handleSave = async () => {
        setLoading(true)

        try {
            const result = await updateAutoCheckinPreferences({
                autoCheckInEnabled,
                autoCheckOutEnabled,
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(t("updateSuccess"))
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

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={loading || isDemo}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {tCommon("actions.save")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
