"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateAutoCheckinPreferences } from "../_actions/profile-actions"

interface AutoCheckinPreferencesProps {
    initialEnabled: boolean
    initialCheckoutEnabled: boolean
    initialWorkDays: number[]
    isDemo: boolean
}

export function AutoCheckinPreferences({
    initialEnabled,
    initialCheckoutEnabled,
    initialWorkDays,
    isDemo,
}: AutoCheckinPreferencesProps) {
    const t = useTranslations("profile.autoCheckin")
    const tCommon = useTranslations("common")

    const [loading, setLoading] = useState(false)
    const [autoCheckInEnabled, setAutoCheckInEnabled] = useState(initialEnabled)
    const [autoCheckOutEnabled, setAutoCheckOutEnabled] = useState(initialCheckoutEnabled)
    const [workDays, setWorkDays] = useState<number[]>(initialWorkDays)

    const DAY_KEYS = [
        { day: 1, labelKey: "mon" },
        { day: 2, labelKey: "tue" },
        { day: 3, labelKey: "wed" },
        { day: 4, labelKey: "thu" },
        { day: 5, labelKey: "fri" },
        { day: 6, labelKey: "sat" },
        { day: 0, labelKey: "sun" },
    ] as const

    function toggleDay(day: number) {
        setWorkDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
    }

    const handleSave = async () => {
        setLoading(true)

        try {
            const result = await updateAutoCheckinPreferences({
                autoCheckInEnabled,
                autoCheckOutEnabled,
                workDays,
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

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t("workDaysLabel")}</Label>
                        <p className="text-sm text-muted-foreground">{t("workDaysDescription")}</p>
                        <div className="flex gap-1 flex-wrap">
                            {DAY_KEYS.map(({ day, labelKey }) => {
                                const selected = workDays.includes(day)
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        disabled={isDemo}
                                        className={[
                                            "w-10 h-10 rounded-md text-sm font-medium border transition-colors",
                                            selected
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background text-foreground border-border hover:bg-muted",
                                            isDemo
                                                ? "opacity-50 cursor-not-allowed"
                                                : "cursor-pointer",
                                        ].join(" ")}
                                    >
                                        {t(labelKey)}
                                    </button>
                                )
                            })}
                        </div>
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
