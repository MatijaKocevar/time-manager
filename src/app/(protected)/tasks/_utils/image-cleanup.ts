import { getStorageAdapter } from "@/lib/storage/factory"

const UPLOAD_URL_PATTERN = /<img[^>]+src="(\/api\/uploads\/[^"]+)"/g

function extractUploadUrls(html: string | null): string[] {
    if (!html) return []

    const urls: string[] = []
    let match: RegExpExecArray | null

    while ((match = UPLOAD_URL_PATTERN.exec(html)) !== null) {
        urls.push(match[1])
    }

    UPLOAD_URL_PATTERN.lastIndex = 0
    return urls
}

export async function deleteOrphanedImages(
    oldHtml: string | null,
    newHtml: string | null
): Promise<void> {
    const oldUrls = extractUploadUrls(oldHtml)
    const newUrls = new Set(extractUploadUrls(newHtml))

    const orphanedUrls = oldUrls.filter((url) => !newUrls.has(url))

    if (orphanedUrls.length === 0) return

    const adapter = getStorageAdapter()

    await Promise.allSettled(orphanedUrls.map((url) => adapter.delete(url).catch(() => undefined)))
}

export async function deleteAllTaskImages(html: string | null): Promise<void> {
    return deleteOrphanedImages(html, null)
}
