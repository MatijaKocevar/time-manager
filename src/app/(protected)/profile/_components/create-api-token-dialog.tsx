"use client"

import { useState } from "react"
import { Check, Copy, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ApiTokenDisplay } from "../_schemas/api-token-schemas"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface CreateApiTokenDialogProps {
    open: boolean
    name: string
    expiresInDays: number | null
    defaultHourType: ApiTokenDisplay["defaultHourType"]
    isSubmitting: boolean
    createdToken: string | null
    error: string | null
    onOpenChange: (open: boolean) => void
    onNameChange: (name: string) => void
    onExpiresInDaysChange: (days: number | null) => void
    onDefaultHourTypeChange: (type: ApiTokenDisplay["defaultHourType"]) => void
    onSubmit: () => void
}

const NONE_VALUE = "none"

const HOUR_TYPE_OPTIONS = [
    { value: "OFF_HOURS", labelKey: "offHours" },
    { value: "WORK", labelKey: "work" },
    { value: "WORK_FROM_HOME", labelKey: "workFromHome" },
    { value: "BREAK", labelKey: "break" },
    { value: "PRIVATE", labelKey: "private" },
    { value: "OVERTIME_USE", labelKey: "overtimeUse" },
] as const

export function CreateApiTokenDialog({
    open,
    name,
    expiresInDays,
    defaultHourType,
    isSubmitting,
    createdToken,
    error,
    onOpenChange,
    onNameChange,
    onExpiresInDaysChange,
    onDefaultHourTypeChange,
    onSubmit,
}: CreateApiTokenDialogProps) {
    const t = useTranslations("profile.apiTokens")
    const tTypes = useTranslations("hours.types")
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        if (!createdToken) {
            return
        }

        await navigator.clipboard.writeText(createdToken)
        setCopied(true)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                {createdToken ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>{t("createdTitle")}</DialogTitle>
                            <DialogDescription>{t("createdDescription")}</DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center gap-2">
                            <Input
                                readOnly
                                value={createdToken}
                                className="font-mono text-xs"
                                onFocus={(event) => event.target.select()}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleCopy}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <DialogFooter>
                            <Button type="button" onClick={() => onOpenChange(false)}>
                                {t("done")}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault()
                            onSubmit()
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>{t("createTitle")}</DialogTitle>
                            <DialogDescription>{t("createDescription")}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="api-token-name">{t("name")}</Label>
                                <Input
                                    id="api-token-name"
                                    value={name}
                                    onChange={(event) => onNameChange(event.target.value)}
                                    placeholder={t("namePlaceholder")}
                                    disabled={isSubmitting}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t("expiresIn")}</Label>
                                <Select
                                    value={expiresInDays ? String(expiresInDays) : "never"}
                                    onValueChange={(value) =>
                                        onExpiresInDaysChange(
                                            value === "never" ? null : Number(value)
                                        )
                                    }
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="never">{t("expiresNever")}</SelectItem>
                                        <SelectItem value="30">{t("expires30")}</SelectItem>
                                        <SelectItem value="90">{t("expires90")}</SelectItem>
                                        <SelectItem value="365">{t("expires365")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t("defaultHourType")}</Label>
                                <Select
                                    value={defaultHourType ?? NONE_VALUE}
                                    onValueChange={(value) =>
                                        onDefaultHourTypeChange(
                                            value === NONE_VALUE
                                                ? null
                                                : (value as ApiTokenDisplay["defaultHourType"])
                                        )
                                    }
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE_VALUE}>
                                            {t("defaultHourTypeApp")}
                                        </SelectItem>
                                        {HOUR_TYPE_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {tTypes(option.labelKey)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    {t("defaultHourTypeHint")}
                                </p>
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                {t("cancel")}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? t("creating") : t("create")}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
