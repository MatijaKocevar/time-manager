import fs from "fs/promises"
import path from "path"
import type { StorageAdapter } from "./adapter"

function getBasePath(): string {
    return process.env.UPLOAD_BASE_PATH ?? path.join(process.cwd(), "public", "uploads")
}

function getBaseUrl(): string {
    return process.env.UPLOAD_BASE_URL ?? "/api/uploads"
}

export const localAdapter: StorageAdapter = {
    async upload(buffer, filename, subpath) {
        const dir = path.join(getBasePath(), subpath)
        await fs.mkdir(dir, { recursive: true })
        const filePath = path.join(dir, filename)
        await fs.writeFile(filePath, buffer)
        return `${getBaseUrl()}/${subpath}/${filename}`
    },

    async delete(storedPath) {
        const relative = storedPath.replace(getBaseUrl(), "")
        const absolute = path.join(getBasePath(), relative)
        const resolved = path.resolve(absolute)
        const base = path.resolve(getBasePath())
        if (!resolved.startsWith(base)) {
            throw new Error("Invalid path")
        }
        await fs.unlink(resolved).catch(() => undefined)
    },

    getUrl(storedPath) {
        return storedPath
    },
}
