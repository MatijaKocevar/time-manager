import type { StorageAdapter } from "./adapter"
import { localAdapter } from "./local-adapter"

export function getStorageAdapter(): StorageAdapter {
    const storageType = process.env.STORAGE_TYPE ?? "local"

    switch (storageType) {
        case "local":
            return localAdapter
        default:
            throw new Error(`Unknown STORAGE_TYPE: "${storageType}". Supported values: "local"`)
    }
}
