import { z } from "zod"

export const ExportFormatSchema = z.enum(["csv", "excel", "json"])

export const DateRangeInputSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
})

export const ExportOptionsSchema = z.object({
    format: ExportFormatSchema,
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    userId: z.string().optional(),
})

export type ExportFormat = z.infer<typeof ExportFormatSchema>
export type DateRangeInput = z.infer<typeof DateRangeInputSchema>
export type ExportOptions = z.infer<typeof ExportOptionsSchema>
