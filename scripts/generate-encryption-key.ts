import crypto from "crypto"

const key = crypto.randomBytes(32).toString("hex")

console.log("\n=== Encryption Key Generated ===\n")
console.log("Add this line to your .env file:\n")
console.log(`ENCRYPTION_KEY=${key}\n`)
console.log("Keep this key secure and never commit it to version control!")
console.log("If you lose this key, you will not be able to decrypt existing credentials.\n")
