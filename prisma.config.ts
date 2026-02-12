import { defineConfig } from "prisma/config"

// Load environment variables from .env files (only in development)
// In Docker, environment variables are injected by docker-compose
try {
    const { config } = await import("dotenv")
    config({ path: [".env.development.local", ".env.local", ".env"] })
} catch {
    // dotenv not available (Docker/production), environment variables already set
}

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    engine: "classic",
    datasource: {
        url: process.env.DATABASE_URL || "file:./prisma/database/dev.db",
    },
})
