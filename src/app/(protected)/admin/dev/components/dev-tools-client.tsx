"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, Loader2, Mail, Bell, Users, Workflow, List } from "lucide-react"
import { useDevToolsStore } from "../stores/dev-tools-store"
import { type ActionResult, type DevToolsClientProps } from "../schemas/dev-tools-schemas"

export function DevToolsClient({ translations: t }: DevToolsClientProps) {
    const emailInput = useDevToolsStore((state) => state.emailInput)
    const userIdInput = useDevToolsStore((state) => state.userIdInput)
    const userEmailInput = useDevToolsStore((state) => state.userEmailInput)

    const emailResult = useDevToolsStore((state) => state.emailResult)
    const pushResult = useDevToolsStore((state) => state.pushResult)
    const adminPushResult = useDevToolsStore((state) => state.adminPushResult)
    const flowResult = useDevToolsStore((state) => state.flowResult)
    const subscriptionsResult = useDevToolsStore((state) => state.subscriptionsResult)

    const emailLoading = useDevToolsStore((state) => state.emailLoading)
    const pushLoading = useDevToolsStore((state) => state.pushLoading)
    const adminPushLoading = useDevToolsStore((state) => state.adminPushLoading)
    const flowLoading = useDevToolsStore((state) => state.flowLoading)
    const subscriptionsLoading = useDevToolsStore((state) => state.subscriptionsLoading)

    const setEmailInput = useDevToolsStore((state) => state.setEmailInput)
    const setUserIdInput = useDevToolsStore((state) => state.setUserIdInput)
    const setUserEmailInput = useDevToolsStore((state) => state.setUserEmailInput)

    const handleTestEmail = useDevToolsStore((state) => state.handleTestEmail)
    const handleTestPush = useDevToolsStore((state) => state.handleTestPush)
    const handleTestAdminPush = useDevToolsStore((state) => state.handleTestAdminPush)
    const handleSimulateFlow = useDevToolsStore((state) => state.handleSimulateFlow)
    const handleListSubscriptions = useDevToolsStore((state) => state.handleListSubscriptions)

    const renderResult = (result: ActionResult | null) => {
        if (!result) return null

        const bgColor = result.success
            ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"

        return (
            <div className={`mt-3 border rounded-lg p-4 ${bgColor}`}>
                <div className="flex items-start gap-2">
                    {result.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    ) : (
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                        <p className="text-sm">{result.message || result.error}</p>
                        {result.admins && result.admins.length > 0 && (
                            <div className="mt-2 space-y-1">
                                <p className="text-sm font-medium">{t.results.admins}</p>
                                {result.admins.map((admin, i) => (
                                    <div key={i} className="text-sm">
                                        {admin.name} ({admin.email})
                                    </div>
                                ))}
                            </div>
                        )}
                        {result.steps && result.steps.length > 0 && (
                            <ul className="mt-2 space-y-1 list-disc list-inside">
                                {result.steps.map((step, i) => (
                                    <li key={i} className="text-sm">
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        {t.testEmail.title}
                    </CardTitle>
                    <CardDescription>{t.testEmail.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">{t.testEmail.recipientLabel}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder={t.testEmail.recipientPlaceholder}
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            disabled={emailLoading}
                        />
                    </div>
                    <Button onClick={handleTestEmail} disabled={emailLoading || !emailInput}>
                        {emailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.testEmail.button}
                    </Button>
                    {renderResult(emailResult)}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        {t.testPush.title}
                    </CardTitle>
                    <CardDescription>{t.testPush.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="userId">{t.testPush.userIdLabel}</Label>
                        <Input
                            id="userId"
                            placeholder={t.testPush.userIdPlaceholder}
                            value={userIdInput}
                            onChange={(e) => setUserIdInput(e.target.value)}
                            disabled={pushLoading}
                        />
                    </div>
                    <Button onClick={handleTestPush} disabled={pushLoading || !userIdInput}>
                        {pushLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.testPush.button}
                    </Button>
                    {renderResult(pushResult)}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {t.testAdminPush.title}
                    </CardTitle>
                    <CardDescription>{t.testAdminPush.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={handleTestAdminPush} disabled={adminPushLoading}>
                        {adminPushLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.testAdminPush.button}
                    </Button>
                    {renderResult(adminPushResult)}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Workflow className="h-5 w-5" />
                        {t.simulateFlow.title}
                    </CardTitle>
                    <CardDescription>{t.simulateFlow.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="userEmail">{t.simulateFlow.userEmailLabel}</Label>
                        <Input
                            id="userEmail"
                            type="email"
                            placeholder={t.simulateFlow.userEmailPlaceholder}
                            value={userEmailInput}
                            onChange={(e) => setUserEmailInput(e.target.value)}
                            disabled={flowLoading}
                        />
                    </div>
                    <Button onClick={handleSimulateFlow} disabled={flowLoading || !userEmailInput}>
                        {flowLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.simulateFlow.button}
                    </Button>
                    {renderResult(flowResult)}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <List className="h-5 w-5" />
                        {t.subscriptions.title}
                    </CardTitle>
                    <CardDescription>{t.subscriptions.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={handleListSubscriptions} disabled={subscriptionsLoading}>
                        {subscriptionsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.subscriptions.button}
                    </Button>
                    {subscriptionsResult && subscriptionsResult.success && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                    {subscriptionsResult.count} {t.subscriptions.subscriptionText}
                                </Badge>
                            </div>
                            {subscriptionsResult.subscriptions &&
                                subscriptionsResult.subscriptions.length > 0 && (
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted">
                                                <tr>
                                                    <th className="text-left p-3">
                                                        {t.subscriptions.table.user}
                                                    </th>
                                                    <th className="text-left p-3">
                                                        {t.subscriptions.table.email}
                                                    </th>
                                                    <th className="text-left p-3">
                                                        {t.subscriptions.table.role}
                                                    </th>
                                                    <th className="text-left p-3">
                                                        {t.subscriptions.table.created}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {subscriptionsResult.subscriptions.map((sub) => (
                                                    <tr key={sub.id} className="border-t">
                                                        <td className="p-3">{sub.userName}</td>
                                                        <td className="p-3">{sub.userEmail}</td>
                                                        <td className="p-3">
                                                            <Badge variant="outline">
                                                                {sub.userRole}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3">
                                                            {new Date(
                                                                sub.createdAt
                                                            ).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                        </div>
                    )}
                    {renderResult(
                        subscriptionsResult && !subscriptionsResult.success
                            ? subscriptionsResult
                            : null
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
