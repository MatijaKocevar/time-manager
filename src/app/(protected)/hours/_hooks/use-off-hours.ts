"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { hourKeys } from "../_constants/query-keys"
import { getOffHoursPreview, reclassifyOffHours, undoOffHours } from "../_actions/off-hours-actions"
import type { OffHoursPreview, ReclassifyOffHoursInput } from "../_schemas/off-hours-schemas"

interface UseOffHoursOptions {
    initialDate: string
    onApplied?: () => void
}

export function useOffHours({ initialDate, onApplied }: UseOffHoursOptions) {
    const queryClient = useQueryClient()
    const t = useTranslations("hours.offHours")

    const [date, setDate] = useState(initialDate)
    const [from, setFrom] = useState("16:00")
    const [to, setTo] = useState("23:59")
    const [includeManual, setIncludeManual] = useState(false)
    const [applyToFuture, setApplyToFuture] = useState(false)
    const [preview, setPreview] = useState<OffHoursPreview | null>(null)
    const [windowId, setWindowId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function clearPreview() {
        setPreview(null)
        setWindowId(null)
        setError(null)
    }

    async function loadPreview() {
        setIsLoading(true)
        setError(null)

        try {
            const result = await getOffHoursPreview({ date, from, to, includeManual })

            if ("error" in result) {
                setError(result.error)
                setPreview(null)
                return
            }

            setPreview(result.data)
        } finally {
            setIsLoading(false)
        }
    }

    async function apply() {
        setIsLoading(true)
        setError(null)

        const input: ReclassifyOffHoursInput = {
            date,
            from,
            to,
            includeManual,
            applyToFuture,
        }

        try {
            const result = await reclassifyOffHours(input)

            if ("error" in result) {
                setError(result.error)
                return
            }

            setWindowId(result.data.windowId)
            setPreview(null)
            toast.success(
                t("applied", {
                    hours: result.data.hoursMoved.toFixed(2),
                    updated: result.data.updated,
                    created: result.data.created,
                })
            )
            await queryClient.invalidateQueries({ queryKey: hourKeys.all })
            onApplied?.()
        } finally {
            setIsLoading(false)
        }
    }

    async function undo() {
        if (!windowId) {
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const result = await undoOffHours({ windowId })

            if ("error" in result) {
                setError(result.error)
                return
            }

            setWindowId(null)
            toast.success(t("undone"))
            await queryClient.invalidateQueries({ queryKey: hourKeys.all })
            onApplied?.()
        } finally {
            setIsLoading(false)
        }
    }

    return {
        date,
        from,
        to,
        includeManual,
        applyToFuture,
        preview,
        windowId,
        isLoading,
        error,
        setDate,
        setFrom,
        setTo,
        setIncludeManual,
        setApplyToFuture,
        clearPreview,
        loadPreview,
        apply,
        undo,
    }
}
