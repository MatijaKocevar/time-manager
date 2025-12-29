"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Download, FileText, FileSpreadsheet, FileJson } from "lucide-react"
import { downloadFile, base64ToBuffer, type ExportFormat } from "@/features/export"

interface ExportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultStartDate: string
    defaultEndDate: string
    onExport: (format: ExportFormat, startDate: string, endDate: string) => Promise<{
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
    defaultStartDate,
    defaultEndDate,
    onExport,
    filenamePrefix,
    title,
    description,
}: ExportDialogProps) {
    const t = useTranslations("export")
    const tCommon = useTranslations("common")

    const [format, setFormat] = useState<ExportFormat>("excel")
    const [startDate, setStartDate] = useState(defaultStartDate)
    const [endDate, setEndDate] = useState(defaultEndDate)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleExport = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await onExport(format, startDate, endDate)

            if (result.error) {
                setError(result.error)
                return
            }

            if (result.data) {
                const start = startDate.replace(/-/g, "")
                const end = endDate.replace(/-/g, "")
                const extension = format === "excel" ? "xlsx" : format
                const filename = `${filenamePrefix}-${start}-${end}.${extension}`

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
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>{t("dialog.format")}</Label>
                        <RadioGroup value={format} onValueChange={(value: string) => setFormat(value as ExportFormat)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="excel" id="excel" />
                                <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    {t("formats.excel")}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="csv" id="csv" />
                                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                                    <FileText className="h-4 w-4" />
                                    {t("formats.csv")}
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="json" id="json" />
                                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                                    <FileJson className="h-4 w-4" />
                                    {t("formats.json")}
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="start-date">{t("dialog.startDate")}</Label>
                        <Input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="end-date">{t("dialog.endDate")}</Label>
                        <Input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            disabled={isLoading}
                        />
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
                            disabled={isLoading || !startDate || !endDate}
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
