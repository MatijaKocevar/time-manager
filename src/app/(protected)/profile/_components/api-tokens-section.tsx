"use client"

import { KeyRound, Plus, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useApiTokens } from "../_hooks/use-api-tokens"
import { CreateApiTokenDialog } from "./create-api-token-dialog"
import type { ApiTokenDisplay } from "../_schemas/api-token-schemas"

interface ApiTokensSectionProps {
    initialTokens: ApiTokenDisplay[]
    isDemo: boolean
}

export function ApiTokensSection({ initialTokens, isDemo }: ApiTokensSectionProps) {
    const t = useTranslations("profile.apiTokens")
    const {
        tokens,
        isDialogOpen,
        name,
        expiresInDays,
        isSubmitting,
        createdToken,
        error,
        openDialog,
        closeDialog,
        setName,
        setExpiresInDays,
        submitToken,
        revoke,
    } = useApiTokens(initialTokens)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    {t("title")}
                </CardTitle>
                <CardDescription>{t("description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {tokens.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("empty")}</p>
                ) : (
                    <ul className="divide-y rounded-md border">
                        {tokens.map((token) => (
                            <li
                                key={token.id}
                                className="flex items-center justify-between gap-3 p-3"
                            >
                                <div className="min-w-0 space-y-1">
                                    <p className="truncate text-sm font-medium">{token.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {t("lastUsed")}:{" "}
                                        {token.lastUsedAt
                                            ? new Date(token.lastUsedAt).toLocaleString()
                                            : t("neverUsed")}
                                        {" · "}
                                        {t("expires")}:{" "}
                                        {token.expiresAt
                                            ? new Date(token.expiresAt).toLocaleDateString()
                                            : t("never")}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => revoke(token.id)}
                                    aria-label={t("revoke")}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="flex justify-end">
                    <Button onClick={openDialog} disabled={isDemo}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("create")}
                    </Button>
                </div>
            </CardContent>
            <CreateApiTokenDialog
                open={isDialogOpen}
                name={name}
                expiresInDays={expiresInDays}
                isSubmitting={isSubmitting}
                createdToken={createdToken}
                error={error}
                onOpenChange={(open) => (open ? openDialog() : closeDialog())}
                onNameChange={setName}
                onExpiresInDaysChange={setExpiresInDays}
                onSubmit={submitToken}
            />
        </Card>
    )
}
