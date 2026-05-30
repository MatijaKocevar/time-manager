export interface StorageAdapter {
    upload(buffer: Buffer, filename: string, subpath: string): Promise<string>
    delete(storedPath: string): Promise<void>
    getUrl(storedPath: string): string
}
