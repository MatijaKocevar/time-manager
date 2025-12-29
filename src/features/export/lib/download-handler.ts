import type { ExportFormat } from "../schemas"
import { getMimeType } from "../utils/filename"

export function downloadFile(
    data: string | Buffer,
    filename: string,
    format: ExportFormat
): void {
    const mimeType = getMimeType(format)

    const blob =
        typeof data === "string" ? new Blob([data], { type: mimeType }) : new Blob([new Uint8Array(data)], { type: mimeType })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export function base64ToBuffer(base64: string): Buffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return Buffer.from(bytes)
}
