"use client"

import { KeyRound, Plus, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useApiTokens } from "../_hooks/use-api-tokens"
import { CreateApiTokenDialog } from "./create-api-token-dialog"
import type { ApiTokenDisplay } from "../_schemas/api-token-schemas"

const NONE_VALUE = "none"

const TOKEN_HOUR_TYPE_OPTIONS = [
    { value: "OFF_HOURS", labelKey: "offHours" },
    { value: "WORK", labelKey: "work" },
    { value: "WORK_FROM_HOME", labelKey: "workFromHome" },
    { value: "BREAK", labelKey: "break" },
    { value: "PRIVATE", labelKey: "private" },
    { value: "OVERTIME_USE", labelKey: "overtimeUse" },
] as const

interface ApiTokensSectionProps {
    initialTokens: ApiTokenDisplay[]
    isDemo: boolean
}

export function ApiTokensSection({ initialTokens, isDemo }: ApiTokensSectionProps) {
    const t = useTranslations("profile.apiTokens")
    const tTypes = useTranslations("hours.types")
    const {
        tokens,
        isDialogOpen,
        name,
        expiresInDays,
        defaultHourType,
        isSubmitting,
        createdToken,
        error,
        openDialog,
        closeDialog,
        setName,
        setExpiresInDays,
        setDefaultHourType,
        submitToken,
        updateHourType,
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
                                    <div className="flex items-center gap-2 pt-1">
                                        <span className="text-xs text-muted-foreground">
                                            {t("defaultHourType")}
                                        </span>
                                        <Select
                                            value={token.defaultHourType ?? NONE_VALUE}
                                            onValueChange={(value) =>
                                                updateHourType(
                                                    token.id,
                                                    value === NONE_VALUE
                                                        ? null
                                                        : (value as ApiTokenDisplay["defaultHourType"])
                                                )
                                            }
                                            disabled={isDemo}
                                        >
                                            <SelectTrigger className="h-7 w-[190px] text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={NONE_VALUE}>
                                                    {t("defaultHourTypeApp")}
                                                </SelectItem>
                                                {TOKEN_HOUR_TYPE_OPTIONS.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {tTypes(option.labelKey)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
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
                defaultHourType={defaultHourType}
                isSubmitting={isSubmitting}
                createdToken={createdToken}
                error={error}
                onOpenChange={(open) => (open ? openDialog() : closeDialog())}
                onNameChange={setName}
                onExpiresInDaysChange={setExpiresInDays}
                onDefaultHourTypeChange={setDefaultHourType}
                onSubmit={submitToken}
            />
        </Card>
    )
}
