import { prisma } from "../src/lib/prisma"
import fs from "fs"
import path from "path"

async function main() {
    console.log("Applying view fix migration...")

    const sql = fs.readFileSync(
        path.join(__dirname, "../prisma/migrations/20251231_fix_view_type_grouping/migration.sql"),
        "utf-8"
    )

    await prisma.$executeRawUnsafe(sql)

    console.log("✅ Migration applied successfully!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
