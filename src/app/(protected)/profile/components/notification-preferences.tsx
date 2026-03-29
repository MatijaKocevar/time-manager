"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { updateNotificationPreferences } from "@/features/notifications/actions/notification-actions"
import type { NotificationPreference, UserRole } from "../../../../../prisma/generated/client"

interface NotificationPreferencesProps {
    initialPreferences: NotificationPreference
    userRole: UserRole
}

export function NotificationPreferences({
    initialPreferences,
    userRole,
}: NotificationPreferencesProps) {
    const t = useTranslations("profile.notifications")
    const tCommon = useTranslations("common")

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [preferences, setPreferences] = useState(initialPreferences)

    const isAdmin = userRole === "ADMIN"

    const handleToggle = (field: keyof NotificationPreference, value: boolean) => {
        setPreferences((prev) => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const result = await updateNotificationPreferences({
                emailNewRequest: preferences.emailNewRequest,
                emailRequestApproved: preferences.emailRequestApproved,
                emailRequestRejected: preferences.emailRequestRejected,
                emailRequestCancelled: preferences.emailRequestCancelled,
                pushNewRequest: preferences.pushNewRequest,
                pushRequestApproved: preferences.pushRequestApproved,
                pushRequestRejected: preferences.pushRequestRejected,
                pushRequestCancelled: preferences.pushRequestCancelled,
                emailAutoCheckin: preferences.emailAutoCheckin,
                pushAutoCheckin: preferences.pushAutoCheckin,
                emailAutoCheckout: preferences.emailAutoCheckout,
                pushAutoCheckout: preferences.pushAutoCheckout,
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

                {isAdmin && (
                    <>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium mb-3">{t("newRequestTitle")}</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {t("newRequestDescription")}
                                </p>
                                <div className="space-y-3 ml-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="emailNewRequest"
                                            checked={preferences.emailNewRequest}
                                            onChange={(e) =>
                                                handleToggle("emailNewRequest", e.target.checked)
                                            }
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <Label htmlFor="emailNewRequest" className="cursor-pointer">
                                            {t("emailLabel")}
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="pushNewRequest"
                                            checked={preferences.pushNewRequest}
                                            onChange={(e) =>
                                                handleToggle("pushNewRequest", e.target.checked)
                                            }
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <Label htmlFor="pushNewRequest" className="cursor-pointer">
                                            {t("pushLabel")}
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Separator />
                    </>
                )}

                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium mb-3">{t("approvedTitle")}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {t("approvedDescription")}
                        </p>
                        <div className="space-y-3 ml-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="emailRequestApproved"
                                    checked={preferences.emailRequestApproved}
                                    onChange={(e) =>
                                        handleToggle("emailRequestApproved", e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="emailRequestApproved" className="cursor-pointer">
                                    {t("emailLabel")}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="pushRequestApproved"
                                    checked={preferences.pushRequestApproved}
                                    onChange={(e) =>
                                        handleToggle("pushRequestApproved", e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="pushRequestApproved" className="cursor-pointer">
                                    {t("pushLabel")}
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium mb-3">{t("rejectedTitle")}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {t("rejectedDescription")}
                        </p>
                        <div className="space-y-3 ml-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="emailRequestRejected"
                                    checked={preferences.emailRequestRejected}
                                    onChange={(e) =>
                                        handleToggle("emailRequestRejected", e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="emailRequestRejected" className="cursor-pointer">
                                    {t("emailLabel")}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="pushRequestRejected"
                                    checked={preferences.pushRequestRejected}
                                    onChange={(e) =>
                                        handleToggle("pushRequestRejected", e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="pushRequestRejected" className="cursor-pointer">
                                    {t("pushLabel")}
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium mb-3">{t("cancelledTitle")}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {t("cancelledDescription")}
                        </p>
                        <div className="space-y-3 ml-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="emailRequestCancelled"
                                    checked={preferences.emailRequestCancelled}
                                    onChange={(e) =>
                                        handleToggle("emailRequestCancelled", e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="emailRequestCancelled" className="cursor-pointer">
                                    {t("emailLabel")}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="pushRequestCancelled"
                                    checked={preferences.pushRequestCancelled}
                                    onChange={(e) =>
                                        handleToggle("pushRequestCancelled", e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="pushRequestCancelled" className="cursor-pointer">
                                    {t("pushLabel")}
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium mb-3">{t("autoCheckinTitle")}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {t("autoCheckinDescription")}
                        </p>
                        <div className="space-y-3 ml-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="emailAutoCheckin"
                                    checked={preferences.emailAutoCheckin}
                                    onChange={(e) =>
                                        handleToggle("emailAutoCheckin", e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="emailAutoCheckin" className="cursor-pointer">
                                    {t("emailLabel")}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="pushAutoCheckin"
                                    checked={preferences.pushAutoCheckin}
                                    onChange={(e) =>
                                        handleToggle("pushAutoCheckin", e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="pushAutoCheckin" className="cursor-pointer">
                                    {t("pushLabel")}
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium mb-3">{t("autoCheckoutTitle")}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {t("autoCheckoutDescription")}
                        </p>
                        <div className="space-y-3 ml-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="emailAutoCheckout"
                                    checked={preferences.emailAutoCheckout}
                                    onChange={(e) =>
                                        handleToggle("emailAutoCheckout", e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="emailAutoCheckout" className="cursor-pointer">
                                    {t("emailLabel")}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="pushAutoCheckout"
                                    checked={preferences.pushAutoCheckout}
                                    onChange={(e) =>
                                        handleToggle("pushAutoCheckout", e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="pushAutoCheckout" className="cursor-pointer">
                                    {t("pushLabel")}
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? tCommon("status.saving") : t("savePreferences")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
