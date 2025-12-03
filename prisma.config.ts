import { defineConfig } from "prisma/config"
import { config } from "dotenv"

// Load environment variables from .env files
config({ path: [".env.development.local", ".env.local", ".env"] })

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
