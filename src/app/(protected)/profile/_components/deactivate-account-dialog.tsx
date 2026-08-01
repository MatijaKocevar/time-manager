"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useTranslations } from "next-intl"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"
import { deactivateAccount } from "../_actions/profile-actions"
import { useProfileStore } from "../_stores/profile-store"

interface DeactivateAccountDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeactivateAccountDialog({ open, onOpenChange }: DeactivateAccountDialogProps) {
    const router = useRouter()
    const t = useTranslations("profile.deactivation")
    const tCommon = useTranslations("common.actions")
    const [anonymize, setAnonymize] = useState(false)

    const isLoading = useProfileStore((state) => state.deactivateForm.isLoading)
    const error = useProfileStore((state) => state.deactivateForm.error)
    const setDeactivateLoading = useProfileStore((state) => state.setDeactivateLoading)
    const setDeactivateError = useProfileStore((state) => state.setDeactivateError)
    const clearDeactivateError = useProfileStore((state) => state.clearDeactivateError)

    const handleDeactivate = async () => {
        setDeactivateLoading(true)
        clearDeactivateError()

        const result = await deactivateAccount({ anonymize })

        if (result.error) {
            setDeactivateError(result.error)
            setDeactivateLoading(false)
        } else {
            await signOut({ redirect: false })
            router.push("/login")
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!isLoading) {
            onOpenChange(newOpen)
            if (!newOpen) {
                setAnonymize(false)
                clearDeactivateError()
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        {t("dialogTitle")}
                    </DialogTitle>
                    <DialogDescription>{t("dialogDescription")}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                    )}

                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="anonymize"
                            checked={anonymize}
                            onCheckedChange={(checked) => setAnonymize(checked === true)}
                            disabled={isLoading}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="anonymize"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                {t("anonymizeLabel")}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {t("anonymizeDescription")}
                            </p>
                        </div>
                    </div>

                    {anonymize && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            <p className="font-semibold">Warning:</p>
                            <p>{t("anonymizeDescription")}</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isLoading}
                    >
                        {tCommon("cancel")}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDeactivate}
                        disabled={isLoading}
                    >
                        {isLoading ? t("deactivating") : t("confirmButton")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
