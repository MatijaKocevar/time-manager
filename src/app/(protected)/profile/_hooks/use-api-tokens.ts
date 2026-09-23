"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useApiTokenStore } from "../_stores/api-token-store"
import { createApiToken, revokeApiToken } from "../_actions/api-token-actions"
import type { ApiTokenDisplay } from "../_schemas/api-token-schemas"

export function useApiTokens(initialTokens: ApiTokenDisplay[]) {
    const router = useRouter()
    const t = useTranslations("profile.apiTokens")

    const tokens = useApiTokenStore((state) => state.tokens)
    const isDialogOpen = useApiTokenStore((state) => state.isDialogOpen)
    const name = useApiTokenStore((state) => state.name)
    const expiresInDays = useApiTokenStore((state) => state.expiresInDays)
    const isSubmitting = useApiTokenStore((state) => state.isSubmitting)
    const createdToken = useApiTokenStore((state) => state.createdToken)
    const error = useApiTokenStore((state) => state.error)
    const setTokens = useApiTokenStore((state) => state.setTokens)
    const setDialogOpen = useApiTokenStore((state) => state.setDialogOpen)
    const setName = useApiTokenStore((state) => state.setName)
    const setExpiresInDays = useApiTokenStore((state) => state.setExpiresInDays)
    const setSubmitting = useApiTokenStore((state) => state.setSubmitting)
    const setCreatedToken = useApiTokenStore((state) => state.setCreatedToken)
    const setError = useApiTokenStore((state) => state.setError)
    const resetForm = useApiTokenStore((state) => state.resetForm)

    useEffect(() => {
        setTokens(initialTokens)
    }, [initialTokens, setTokens])

    function translateError(message: string) {
        return message.startsWith("profile.apiTokens.")
            ? t(message.split(".").pop() as never)
            : message
    }

    function openDialog() {
        setDialogOpen(true)
    }

    function closeDialog() {
        setDialogOpen(false)
        resetForm()
    }

    async function submitToken() {
        if (!name.trim()) {
            setError(t("nameRequired"))
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            const result = await createApiToken({ name: name.trim(), expiresInDays })

            if ("success" in result && result.success) {
                setCreatedToken(result.token)
                setTokens([result.apiToken, ...tokens])
                router.refresh()
            } else if ("error" in result) {
                setError(translateError(result.error ?? t("errors.createFailed")))
            }
        } catch (thrown) {
            setError(thrown instanceof Error ? thrown.message : t("errors.createFailed"))
        } finally {
            setSubmitting(false)
        }
    }

    async function revoke(id: string) {
        if (!confirm(t("revokeConfirm"))) {
            return
        }

        try {
            const result = await revokeApiToken({ id })

            if ("success" in result && result.success) {
                setTokens(tokens.filter((token) => token.id !== id))
                toast.success(t("revokeSuccess"))
                router.refresh()
            } else if ("error" in result) {
                toast.error(translateError(result.error ?? t("errors.revokeFailed")))
            }
        } catch {
            toast.error(t("errors.revokeFailed"))
        }
    }

    return {
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
    }
}
