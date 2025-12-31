import * as Papa from "papaparse"

export function generateCSV<T extends Record<string, unknown>>(
    data: T[],
    headers?: string[]
): string {
    if (data.length === 0) {
        return ""
    }

    const csv = Papa.unparse(data as Record<string, unknown>[], {
        header: true,
        columns: headers,
    })

    return csv
}

export function parseCSVHeaders<T extends Record<string, unknown>>(data: T[]): string[] {
    if (data.length === 0) {
        return []
    }

    return Object.keys(data[0])
}
