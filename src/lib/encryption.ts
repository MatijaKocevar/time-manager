import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const TAG_POSITION = SALT_LENGTH + IV_LENGTH
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH

function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY

    if (!key) {
        throw new Error(
            "ENCRYPTION_KEY is not set in environment variables. " +
                "Generate a key using: npm run generate-encryption-key"
        )
    }

    if (key.length !== 64) {
        throw new Error("ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes)")
    }

    return Buffer.from(key, "hex")
}

export function encrypt(text: string): string {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const salt = crypto.randomBytes(SALT_LENGTH)

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])

    const tag = cipher.getAuthTag()

    return Buffer.concat([salt, iv, tag, encrypted]).toString("hex")
}

export function decrypt(encryptedHex: string): string {
    const key = getEncryptionKey()
    const data = Buffer.from(encryptedHex, "hex")

    const iv = data.subarray(SALT_LENGTH, TAG_POSITION)
    const tag = data.subarray(TAG_POSITION, ENCRYPTED_POSITION)
    const encrypted = data.subarray(ENCRYPTED_POSITION)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    return decipher.update(encrypted) + decipher.final("utf8")
}
