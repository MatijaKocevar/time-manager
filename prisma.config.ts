import { defineConfig } from "prisma/config"

if (process.env.NODE_ENV !== "production") {
    try {
        const { config } = await import("dotenv")
        config({ path: [".env.development.local", ".env.local", ".env"] })
    } catch {
        // dotenv not available, environment variables already set
    }
}

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env.DATABASE_URL || "file:./prisma/database/dev.db",
    },
})
