"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { updateNotificationPreferences } from "../actions/notification-actions"
import type { NotificationPreference, UserRole } from "../../../../../prisma/generated/client"

interface NotificationPreferencesProps {
    initialPreferences: NotificationPreference
    userRole: UserRole
}

export function NotificationPreferences({
    initialPreferences,
    userRole,
}: NotificationPreferencesProps) {
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
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                    Configure how you want to be notified about request updates
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                        Notification preferences updated successfully
                    </div>
                )}

                {isAdmin && (
                    <>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium mb-3">
                                    New Request Submitted (Admin Only)
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Receive notifications when users submit new time-off requests
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
                                            Email Notification
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
                                            Push Notification
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
                        <h3 className="text-sm font-medium mb-3">Request Approved</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Receive notifications when your request is approved
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
                                    Email Notification
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
                                    Push Notification
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium mb-3">Request Rejected</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Receive notifications when your request is rejected
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
                                    Email Notification
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
                                    Push Notification
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium mb-3">Request Cancelled</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Receive notifications when a request is cancelled
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
                                    Email Notification
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
                                    Push Notification
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Preferences"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
