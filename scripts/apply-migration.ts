import { prisma } from "@/lib/prisma"
import { readFileSync } from "fs"
import { join } from "path"

async function applyMigration() {
    console.log("Applying migration to fix request hour type display...")
    
    const sqlPath = join(process.cwd(), "prisma/migrations/20251231_fix_request_hour_type_display/migration.sql")
    const sql = readFileSync(sqlPath, "utf-8")
    
    await prisma.$executeRawUnsafe(sql)
    
    console.log("Migration applied successfully!")
    console.log("Refreshing materialized view...")
    
    await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW daily_hour_summary")
    
    console.log("Done!")
    
    await prisma.$disconnect()
}

applyMigration().catch((error: Error) => {
    console.error("Error:", error)
    process.exit(1)
})
