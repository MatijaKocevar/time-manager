"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Download, FileText, FileSpreadsheet, FileJson } from "lucide-react"
import { downloadFile, base64ToBuffer, type ExportFormat } from "@/features/export"

interface ExportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultMonth: string
    onExport: (
        format: ExportFormat,
        months: string[]
    ) => Promise<{
        success?: boolean
        data?: string | Buffer
        error?: string
    }>
    filenamePrefix: string
    title?: string
    description?: string
}

export function ExportDialog({
    open,
    onOpenChange,
    defaultMonth,
    onExport,
    filenamePrefix,
    title,
    description,
}: ExportDialogProps) {
    const t = useTranslations("export")
    const tCommon = useTranslations("common")

    const [format, setFormat] = useState<ExportFormat>("excel")
    const [startMonth, setStartMonth] = useState(defaultMonth)
    const [endMonth, setEndMonth] = useState(defaultMonth)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleExport = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const [startYear, startMonthNum] = startMonth.split("-").map(Number)
            const [endYear, endMonthNum] = endMonth.split("-").map(Number)

            const months: string[] = []
            const start = new Date(startYear, startMonthNum - 1)
            const end = new Date(endYear, endMonthNum - 1)

            const current = new Date(start)
            while (current <= end) {
                const year = current.getFullYear()
                const month = String(current.getMonth() + 1).padStart(2, "0")
                months.push(`${year}-${month}`)
                current.setMonth(current.getMonth() + 1)
            }

            const result = await onExport(format, months)

            if (result.error) {
                setError(result.error)
                return
            }

            if (result.data) {
                const monthsFormatted =
                    months.length === 1
                        ? months[0].replace(/-/g, "")
                        : `${months[0].replace(/-/g, "")}-to-${months[months.length - 1].replace(/-/g, "")}`
                const extension = format === "excel" ? "xlsx" : format
                const filename = `${filenamePrefix}-${monthsFormatted}.${extension}`

                let fileData: string | Buffer = result.data

                if (format === "excel" && typeof result.data === "string") {
                    fileData = base64ToBuffer(result.data)
                }

                downloadFile(fileData, filename, format)
                onOpenChange(false)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Export failed")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title || t("dialog.title")}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>

                <div className="space-y-4">
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                    )}

                    <div className="space-y-2">
                        <Label>{t("dialog.format")}</Label>
                        <RadioGroup
                            value={format}
                            onValueChange={(value: string) => setFormat(value as ExportFormat)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="excel" id="excel" />
                                <Label
                                    htmlFor="excel"
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    {t("formats.excel")}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="csv" id="csv" />
                                <Label
                                    htmlFor="csv"
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <FileText className="h-4 w-4" />
                                    {t("formats.csv")}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="json" id="json" />
                                <Label
                                    htmlFor="json"
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <FileJson className="h-4 w-4" />
                                    {t("formats.json")}
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startMonth">{t("dialog.startMonth")}</Label>
                            <Input
                                id="startMonth"
                                type="month"
                                value={startMonth}
                                onChange={(e) => setStartMonth(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endMonth">{t("dialog.endMonth")}</Label>
                            <Input
                                id="endMonth"
                                type="month"
                                value={endMonth}
                                onChange={(e) => setEndMonth(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {format === "excel" && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            {t("dialog.excelInfo")}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            {tCommon("actions.cancel")}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleExport}
                            disabled={isLoading || !startMonth || !endMonth}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("dialog.exporting")}
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    {tCommon("actions.export")}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
