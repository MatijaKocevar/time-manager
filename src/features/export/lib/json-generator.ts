import type { ExportMetadata } from "../types"

export function generateJSON<T>(data: T[], metadata?: ExportMetadata): string {
    const output = {
        metadata: metadata || {
            exportDate: new Date().toISOString(),
            format: "json" as const,
        },
        data,
        summary: {
            totalRecords: data.length,
        },
    }

    return JSON.stringify(output, null, 2)
}

export function generateJSONCompact<T>(data: T[]): string {
    return JSON.stringify(data)
}
